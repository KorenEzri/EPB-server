import {
  createCustomTypeOptions,
  createTypedefOptions,
  createResolverOptions,
  ResolverOptions,
} from "../../../../types";
import * as mongoUtils from "./util";
import { promisify } from "util";
import Logger from "../../../../logger/logger";
import fs from "fs";
import * as utils from "../../../utils";
import { typeDefs } from "../../../../typeDefs";
import { getTypeDefs } from "../../../codeToString";
import * as parseVars from "../../../utils/parse-vars";
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
  const typeDefInterfaceName = `${interfacePrefix} ${names?.typeDefInterfaceName}`;
  const typeDefInterfaceVariables =
    Array.isArray(properties) && properties.length >= 1
      ? createTypeDefInterface(properties)
      : undefined;
  const typeDefInterface = typeDefInterfaceVariables
    ? typeDefInterfaceName + typeDefInterfaceVariables
    : "";
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
    ? `${names?.actionName}${typeDefActionVariables}: ${returnType}`
    : undefined;
  await insertToTypedefs(typeDefInterface, typeDefAction, type || "type");
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
  if (options.properties[0] || !Array.isArray(options.properties)) {
    await createTypedefFromClientOptions(options);
  } else {
    const typeDefFromClientOptions: optionsFromClient =
      await createTypedefClientOptionsFromFileOptions(options);
    await createTypedefFromClientOptions(typeDefFromClientOptions);
  }
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
  type: string
) => {
  const typeDefsAsString = await read("typeDefs.ts", "utf8");
  const handlerA =
    type === "input" || "Mutation" ? "# mutation-end" : "# query-end";
  let typeDefs = utils.pushIntoString(
    typeDefsAsString,
    handlerA,
    0,
    typeDefAction || ""
  );
  typeDefs = utils.pushIntoString(
    typeDefs,
    "# generated definitions",
    0,
    typeDefInterface || ""
  );
  await write("typeDefs.ts", typeDefs);
};
