import * as mongoUtils from "./util";
import { promisify } from "util";
import fs from "fs";
import * as utils from "../../../utils";
import * as createTypeDefUtils from "./createCRUDTypedefUtils";
import {
  arrangeSchemaConfigFileVars,
  Names,
  optionsFromClient,
  optionsFromInterfaceFile,
  propertiesForInterfaceVariables,
  revampedOptions,
  varList,
} from "../../../../types";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);
type createTypeDefOptions = optionsFromClient | optionsFromInterfaceFile;

////
const checkIfActionRequiresIdentifier = (
  actionName: string | undefined,
  modelName?: string | undefined,
  fromSource?: boolean
) => {
  const deleteReadAndUpdateActionNames = [
    "deleteone",
    "deletemany",
    "readone",
    "readmany",
    "updatemany",
    "updateone",
  ];
  actionName = actionName || "";
  if (fromSource) {
    return deleteReadAndUpdateActionNames.includes(actionName);
  }
  const removeModelName = `${modelName?.split("Model").join("").toLowerCase()}`;
  const actionNameWithoutModelName = actionName
    ?.toLowerCase()
    .split(removeModelName)[0];
  return deleteReadAndUpdateActionNames.includes(
    actionNameWithoutModelName || ""
  );
};
////

////
const insertToTypedefs = async (
  typeDefInterface: string | undefined,
  typeDefAction: string | undefined,
  type: string,
  typeAndInput?: boolean,
  extraTypeDefInterfaceObj?: string | undefined
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
    typeDefInterface || extraTypeDefInterfaceObj || ""
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
////

///////
/////// Typedef creation utils ////////
////
const createStringifiedTypedefInterfaceObj = (varList: varList) => {
  const areAllTypesCustomTypes = utils.checkIfAllTypesAreCustomTypes(varList);
  const cleanTypedefInterface = (typeDefInterface: any) => {
    typeDefInterface = JSON.stringify(typeDefInterface, null, 2);
    typeDefInterface = utils.replaceAllInString(typeDefInterface, '"', "");
    return typeDefInterface;
  };
  const typeDefInterface: any = {};
  varList.forEach((variable: { name: string; type: string }) => {
    const { name, type } = variable;
    if (!name) return;
    typeDefInterface[name] = areAllTypesCustomTypes
      ? type
      : utils.parseSingleTypedefVariable(variable);
  });
  return cleanTypedefInterface(typeDefInterface);
};
const getTypedefInterfaceVariables = (
  properties: propertiesForInterfaceVariables
) => {
  return Array.isArray(properties) && properties.length >= 1
    ? createStringifiedTypedefInterfaceObj(properties)
    : undefined;
};
const getTypeDefActionVariables = (
  properties: propertiesForInterfaceVariables,
  names: Names,
  identifier: { name: string; type: string }
) => {
  let typeDefActionVars: string | undefined;
  const typeDefInterfaceName = names?.typeDefInterfaceName;
  const actionName = names?.actionName;
  const actionRequiresIdentifier = checkIfActionRequiresIdentifier(
    actionName,
    names?.modelName
  );
  const lowercaseActionName = actionName?.toLowerCase();
  if (Array.isArray(properties) && properties.length >= 1) {
    if (lowercaseActionName?.includes("many")) {
      typeDefActionVars = `(options: [${typeDefInterfaceName}])`;
    } else {
      if (actionRequiresIdentifier) {
        if (lowercaseActionName?.includes("update")) {
          const identifierType = utils.capitalizeFirstLetter(
            utils.replaceAllInString(
              identifier.type,
              ["number", "Number"],
              ["Int"]
            )
          );
          typeDefActionVars = `(${identifier.name}: ${identifierType}, options: ${typeDefInterfaceName})`;
        } else {
          typeDefActionVars = `(options: ${typeDefInterfaceName})`;
        }
      }
    }
  } else if (Array.isArray(properties)) {
    typeDefActionVars = `${properties[0].name}:${properties[0].type}`;
  } else if (actionRequiresIdentifier) {
    const identifierType = utils.capitalizeFirstLetter(
      utils.replaceAllInString(
        properties?.type?.toLowerCase() || "",
        ["number"],
        ["Int"]
      )
    );
    typeDefActionVars = `(${properties?.name}:${identifierType})`;
  }
  return typeDefActionVars;
};
const getInitialTypeDefInterface = (
  interfacePrefix: string | undefined,
  names: Names,
  properties: propertiesForInterfaceVariables,
  forReadCRUDAction?: boolean
) => {
  if (forReadCRUDAction) interfacePrefix = "type";
  const typeDefInterfaceName = `${interfacePrefix} ${names?.typeDefInterfaceName}`;
  const typeDefInterfaceVariables = getTypedefInterfaceVariables(properties);
  let typeDefInterface = typeDefInterfaceVariables
    ? typeDefInterfaceName + typeDefInterfaceVariables
    : "";
  typeDefInterface = utils.replaceAllInString(
    typeDefInterface,
    ["number", "Number"],
    ["Int", "Int"]
  );
  return typeDefInterface;
};
const getReturnType = (names: Names, returnType: string | undefined) => {
  return names?.actionName && names.actionName.includes("Many")
    ? `${[returnType]}`
    : returnType;
};
const getTypeDefAction = (
  names: Names,
  returnType: string | undefined,
  typeDefActionVariables: string | undefined
) => {
  return returnType
    ? `${names?.actionName}${typeDefActionVariables || ""}: ${returnType}`
    : undefined;
};
const getTypeDefInterfaceAndAction = async (
  setupOptions: revampedOptions,
  identifier?: { name: string; type: string }
) => {
  if (!identifier) identifier = { name: "", type: "" };
  const { names, properties, interfacePrefix, propertiesForTypeInterface } =
    setupOptions;
  let { returnType } = setupOptions;
  let typeDefInterface = getInitialTypeDefInterface(
    interfacePrefix,
    names,
    properties
  );
  let extraTypeDefInterfaceObj;
  if (propertiesForTypeInterface) {
    extraTypeDefInterfaceObj = getInitialTypeDefInterface(
      interfacePrefix,
      names,
      propertiesForTypeInterface,
      true
    );
  }
  const typeDefActionVariables = getTypeDefActionVariables(
    properties,
    names,
    identifier
  );
  returnType = getReturnType(names, returnType);
  const typeDefAction = getTypeDefAction(
    names,
    returnType,
    typeDefActionVariables
  );
  const doesInterfaceExist = await utils.checkIfConfigItemExists(
    "typeDefInterfaces",
    names?.typeDefInterfaceName || ""
  );
  if (doesInterfaceExist) {
    typeDefInterface = "";
    extraTypeDefInterfaceObj = "";
  }
  return { typeDefInterface, typeDefAction, extraTypeDefInterfaceObj };
};
////
const arrangeSchemaConfigFile = async (
  options: arrangeSchemaConfigFileVars
) => {
  const {
    inputAndType,
    typeDefInterfaceTypeName,
    typeDefInterfaceLength,
    names,
    typeDefAction,
  } = options;
  if (inputAndType) {
    await utils.alterConfigFile(
      "add",
      "typeDefInterfaces",
      typeDefInterfaceTypeName
    );
  }
  if (names?.typeDefInterfaceName || typeDefInterfaceLength > 0) {
    await utils.alterConfigFile(
      "add",
      "typeDefInterfaces",
      names?.typeDefInterfaceName || ""
    );
  }
  if (names?.actionName && typeDefAction) {
    await utils.alterConfigFile("add", "typeDefActions", names.actionName);
    await utils.alterConfigFile("add", "resolvers", names.actionName);
  }
};
/////// Typedef creation utils ////////
const createTypedefFromClientOptions = async (options: optionsFromClient) => {
  const { identifier } = options;
  const setupOptions = createTypeDefUtils.setUpOptions(options);
  const { names, type } = setupOptions;
  let { typeDefInterface, typeDefAction, extraTypeDefInterfaceObj } =
    await getTypeDefInterfaceAndAction(setupOptions, identifier);
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
    !inputAndType,
    extraTypeDefInterfaceObj
  );
  const typeDefInterfaceLength = typeDefInterface.length;
  const arrangeSchemaConfigFileOptions = {
    inputAndType,
    typeDefInterfaceTypeName,
    typeDefInterfaceLength: typeDefInterfaceLength
      ? typeDefInterfaceLength
      : extraTypeDefInterfaceObj?.length || 0,
    names,
    typeDefAction,
  };
  await arrangeSchemaConfigFile(arrangeSchemaConfigFileOptions);
};
///////

////
const getTypescriptInterfaceFromModelName = async (model: string) => {
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
    .slice(startIndex + 1, endIndex - 1)
    .map((line: string) => utils.replaceAllInString(line.trim(), ",", ""));
  return typeDefInterface;
};
const createTypedefClientOptionsFromFileOptions = async (
  options: optionsFromInterfaceFile
) => {
  const { identifier, action, modelName } = options;
  const modelNameOnly = utils.replaceAllInString(modelName, "Schema", "");
  const typeDefInterface = await getTypescriptInterfaceFromModelName(
    modelNameOnly
  );
  const lowerCaseAction = action.toLowerCase();
  const mutationQuery = mongoUtils.mutationCRUDS.includes(action);
  const returnType = mutationQuery
    ? "String"
    : lowerCaseAction.includes("many") || lowerCaseAction.includes("all")
    ? `[${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType]`
    : `${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType`;
  const type = mutationQuery ? "Mutation" : "Query";
  const requiresIdentifier = checkIfActionRequiresIdentifier(
    lowerCaseAction,
    modelNameOnly,
    true
  );
  const isUpdateQuery = lowerCaseAction.includes("update");
  let propertiesForOptions = mutationQuery
    ? typeDefInterface.properties
    : undefined;
  let propertiesForTypeInterface;
  if (requiresIdentifier && !isUpdateQuery) {
    propertiesForOptions = `${identifier.name}: ${identifier.type}`;
    if (
      lowerCaseAction.includes("read") &&
      !utils.checkIfConfigItemExists(
        "typeDefInterfaces",
        `${modelNameOnly}OptionsType`
      )
    ) {
      propertiesForTypeInterface = typeDefInterface.properties;
    }
  }
  const createCustomTypeOptions: optionsFromClient = {
    properties: propertiesForOptions,
    name: modelNameOnly,
    comment: "Custom type created by CRUD generator",
    dbSchema: true,
    typeDef: true,
    returnType,
    type,
    actionName: action,
    propertiesForTypeInterface,
    identifier,
  };
  return createCustomTypeOptions;
};
////

////
const handleOptions = async (options: any) => {
  const typeDefFromClientOptions: optionsFromClient =
    await createTypedefClientOptionsFromFileOptions(options);
  await createTypedefFromClientOptions(typeDefFromClientOptions);
};
////

////
export const createTypedef = async (options: createTypeDefOptions) => {
  await handleOptions(options);
};
////
