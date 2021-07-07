import { optionsFromClient } from "./testNewTypedefCreation";
import * as mongoUtils from "../../../prebuiltActions/crudOperations/mongodb/util";
import * as utils from "../../../utils";

interface revampedOptions {
  properties?:
    | { name: string; type: string }[]
    | { name: string; type: string };
  names?: {
    schemaName: string;
    modelName: string;
    customTypeName: string;
    actionName?: string;
    typeDefInterfaceName?: string;
  };
  comment?: string;
  dbSchema?: boolean;
  typeDef?: boolean;
  returnType?: string;
  type?: string;
  interfacePrefix?: string;
}

const setType = (type: string) => {
  return utils.capitalizeFirstLetter(type);
};
const getActionName = (typeName: string, action?: string) => {
  if (!action) return;
  action = utils.lowercaseFirstLetter(action.split(" ").join(""));
  if (action.includes("Many")) return `${action}${typeName}s`;
  return `${action}${typeName}`;
};
const getInterfacePrefix = (type: string) => {
  type = type.toLowerCase();
  return type === "type" || type === "query" ? "type" : "input";
};
const getTypedefInterfaceName = (typeName: string, action?: string) => {
  if (!action) action = "";
  action = action.split(" ").join("");
  if (mongoUtils.mutationCRUDS.includes(action)) {
    return `${typeName}OptionsInput`;
  } else return `${typeName}OptionsType`;
};
const getNamesFromTypeName = (typeName: string, action?: string) => {
  const schemaName = `${typeName}Schema`;
  const modelName = `${typeName}Model`;
  const customTypeName = `${typeName}Options`;
  const actionName = getActionName(typeName, action);
  const typeDefInterfaceName = getTypedefInterfaceName(typeName, action);
  return {
    schemaName,
    modelName,
    customTypeName,
    actionName,
    typeDefInterfaceName,
  };
};
export const setUpOptions = (options: optionsFromClient) => {
  const { properties, name, actionName, comment, returnType } = options;
  let { type } = options;
  if (!type) type = "type";
  let revampedOpts: revampedOptions = {};
  const interfacePrefix = getInterfacePrefix(type);
  revampedOpts.type = setType(type);
  revampedOpts.properties = utils.splitNameType(properties);
  revampedOpts.names = getNamesFromTypeName(name, actionName);
  revampedOpts.comment = comment;
  revampedOpts.interfacePrefix = interfacePrefix;
  if (returnType) revampedOpts.returnType = returnType;
  return revampedOpts;
};
export const createActionDefinition = () => {};
