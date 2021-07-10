import * as mongoUtils from "../../../prebuiltActions/crudOperations/mongodb/util";
import * as utils from "../../../utils";
import { revampedOptions, optionsFromClient } from "../../../../types";

const setType = (type: string) => {
  return utils.capitalizeFirstLetter(type);
};
const getActionName = (typeName: string, action?: string) => {
  if (!action) return;
  action = utils.lowercaseFirstLetter(action.split(" ").join(""));
  if (action.includes("Many") || action.includes("All"))
    return `${action}${utils.capitalizeFirstLetter(typeName)}s`;
  return `${action}${utils.capitalizeFirstLetter(typeName)}`;
};
const getInterfacePrefix = (type: string) => {
  type = type.toLowerCase();
  return type === "type" || type === "query" ? "type" : "input";
};
const getTypedefInterfaceName = (typeName: string, action?: string) => {
  if (!action) action = "";
  action = action?.split(" ").join("");
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
  const {
    properties,
    name,
    actionName,
    comment,
    returnType,
    propertiesForTypeInterface,
  } = options;
  let { type } = options;
  if (!type || propertiesForTypeInterface) type = "type";
  let revampedOpts: revampedOptions = {};
  const interfacePrefix = getInterfacePrefix(type);
  revampedOpts.type = setType(type);
  revampedOpts.properties = utils.splitNameType(properties);
  revampedOpts.names = getNamesFromTypeName(name, actionName);
  revampedOpts.comment = comment;
  revampedOpts.interfacePrefix = interfacePrefix;
  revampedOpts.propertiesForTypeInterface = propertiesForTypeInterface
    ? utils.splitNameType(propertiesForTypeInterface)
    : undefined;
  if (returnType) revampedOpts.returnType = returnType;
  return revampedOpts;
};
export const createActionDefinition = () => {};
