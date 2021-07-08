import * as mongoUtils from "./util";
import { promisify } from "util";
import fs from "fs";
import * as utils from "../../../utils";
import * as createTypeDefUtils from "./testTypedefCreationutils";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

interface optionsFromInterfaceFile {
  modelName: string;
  action: string;
  resolverType: string;
  identifier: { name: string; type: string };
}
export interface optionsFromClient {
  properties: string[];
  name: string;
  comment: string;
  dbSchema?: boolean;
  typeDef?: boolean;
  returnType?: string;
  type?: string;
  actionName?: string;
}
type createTypeDefOptions = optionsFromClient | optionsFromInterfaceFile;
type varList = { name: string; type: string }[];

//

const getTypedefInterfaceFromModelName = async (model: string) => {
  const filePath = `types/${model}Options.ts`;
  const interfaceFileLineArray = utils.toLineArray(
    await read(filePath, "utf8")
  );
  const typeDefInterface: any = {};
  let startIndex: number = -2,
    endIndex: number = -2;
  interfaceFileLineArray.forEach((line: string) => {
    if (line.includes("export interface") && startIndex === -2) {
      startIndex = interfaceFileLineArray.indexOf(line);
    } else if (line.includes("// added at:") && endIndex === -2) {
      endIndex = interfaceFileLineArray.indexOf(line);
    }
  });
  typeDefInterface.properties = interfaceFileLineArray
    .slice(startIndex + 2, endIndex - 2)
    .map((line: string) => utils.replaceAllInString(line.trim(), ",", ""));
  return typeDefInterface;
};
const createTypedefClientOptionsFromFileOptions = async (
  options: optionsFromInterfaceFile
) => {
  const modelNameOnly = utils.replaceAllInString(
    options.modelName,
    "Schema",
    ""
  );
  const typeDefInterface = await getTypedefInterfaceFromModelName(
    modelNameOnly
  );
  const lowerCaseAction = options.action.toLowerCase();
  const mutationQuery = mongoUtils.mutationCRUDS.includes(options.action);
  const returnType = mutationQuery
    ? "String"
    : lowerCaseAction.includes("many") || lowerCaseAction.includes("all")
    ? `[${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType]`
    : `${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType`;
  const type = mutationQuery ? "Mutation" : "Query";
  const createCustomTypeOptions: optionsFromClient = {
    properties: mutationQuery ? typeDefInterface.properties : undefined,
    name: modelNameOnly,
    comment: "Custom type created by CRUD generator",
    dbSchema: true,
    typeDef: true,
    returnType,
    type,
    actionName: options.action,
  };
  return createCustomTypeOptions;
};
const createTypedefFromClientOptions = async (options: optionsFromClient) => {
  const setupOptions = createTypeDefUtils.setUpOptions(options);
  const { names, properties, interfacePrefix, type } = setupOptions;
  let { returnType } = setupOptions;
  const doesInterfaceExist = await utils.checkIfConfigItemExists(
    "typeDefInterfaces",
    names?.typeDefInterfaceName || ""
  );
  const typeDefInterfaceName = `${interfacePrefix} ${names?.typeDefInterfaceName}`;
  const typeDefInterfaceVariables =
    Array.isArray(properties) && properties.length >= 1
      ? createTypeDefInterface(properties)
      : undefined;
  let typeDefInterface = typeDefInterfaceVariables
    ? typeDefInterfaceName + typeDefInterfaceVariables
    : "";
  typeDefInterface = utils.replaceAllInString(
    typeDefInterface,
    ["number", "Number"],
    ["Int", "Int"]
  );
  const typeDefActionVariables =
    Array.isArray(properties) && properties.length >= 1
      ? `(options: ${names?.typeDefInterfaceName})`
      : Array.isArray(properties)
      ? `${properties[0].name}:${properties[0].type}`
      : undefined;
  returnType =
    names?.actionName && names.actionName.includes("Many")
      ? `${[returnType]}`
      : returnType;
  const typeDefAction = returnType
    ? `${names?.actionName}${typeDefActionVariables || ""}: ${returnType}`
    : undefined;
  if (doesInterfaceExist) typeDefInterface = "";
  const typeDefInterfaceTypeName =
    utils.replaceAllInString(
      names?.typeDefInterfaceName || "",
      "Input",
      "Type"
    ) || "";
  const inputAndType = await utils.checkIfConfigItemExists(
    "typeDefInterfaces",
    typeDefInterfaceTypeName
  );
  await insertToTypedefs(
    typeDefInterface,
    typeDefAction,
    type || "type",
    !inputAndType
  );
  if (inputAndType) {
    await utils.alterConfigFile(
      "add",
      "typeDefInterfaces",
      typeDefInterfaceTypeName
    );
  }
  if (names?.typeDefInterfaceName && typeDefInterface.length) {
    await utils.alterConfigFile(
      "add",
      "typeDefInterfaces",
      names.typeDefInterfaceName
    );
  }
  if (names?.actionName && typeDefAction) {
    await utils.alterConfigFile("add", "typeDefActions", names.actionName);
    await utils.alterConfigFile("add", "resolvers", names.actionName);
  }
};
const handleOptions = async (options: any) => {
  // if (options.properties || !Array.isArray(options.properties)) {
  //   await createTypedefFromClientOptions(options);
  // } else {
  const typeDefFromClientOptions: optionsFromClient =
    await createTypedefClientOptionsFromFileOptions(options);
  await createTypedefFromClientOptions(typeDefFromClientOptions);
  // };
};
export const createTypedef = async (options: createTypeDefOptions) => {
  await handleOptions(options);
};
const createTypeDefInterface = (varList: varList) => {
  const areAllTypesCustomTypes = utils.checkIfAllTypesAreCustomTypes(varList);
  const cleanTypedefInterface = (typeDefInterface: any) => {
    typeDefInterface = JSON.stringify(typeDefInterface, null, 2);
    typeDefInterface = utils.replaceAllInString(typeDefInterface, '"', "");
    return typeDefInterface;
  };
  const typeDefInterface: any = {};
  varList.forEach((variable) => {
    const { name, type } = variable;
    if (!name) return;
    typeDefInterface[name] = areAllTypesCustomTypes
      ? type
      : utils.parseSingleTypedefVariable(variable);
  });
  return cleanTypedefInterface(typeDefInterface);
};
const insertToTypedefs = async (
  typeDefInterface: string | undefined,
  typeDefAction: string | undefined,
  type: string,
  typeAndInput?: boolean
) => {
  const typeDefsAsString = await read("typeDefs.ts", "utf8");
  const handlerA =
    type === "input" || type === "Mutation" ? "# mutation-end" : "# query-end";
  let typeDefs = utils.pushIntoString(
    typeDefsAsString,
    handlerA,
    0,
    typeDefAction || "",
    undefined,
    -1
  );
  typeDefs = utils.pushIntoString(
    typeDefs,
    "# generated definitions",
    0,
    typeDefInterface || ""
  );
  if (typeAndInput) {
    const splatInterface = typeDefInterface?.split("{");
    if (splatInterface) {
      let firstLine = splatInterface[0];
      firstLine = utils.replaceAllInString(
        firstLine || "",
        ["input", "Input"],
        ["type", "Type"]
      );
      splatInterface[0] = firstLine;
      typeDefInterface = splatInterface.join("{");
      typeDefs = utils.pushIntoString(
        typeDefs,
        "# generated definitions",
        0,
        typeDefInterface || ""
      );
    }
  }
  await write("typeDefs.ts", typeDefs);
};
