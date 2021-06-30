import * as utils from "../../utils";
import * as parseUtils from "../parse-vars.util";

const arragenMongoTypes = (type: string) => {
  if (type.split("[").length > 1 && type.split("|").length <= 1) {
    type = "Array";
    return type;
  }
  if (type.split("|").length <= 1) return type;
  type = utils.replaceAllInString(type, "||", "|");
  const splat = type.split("|");
  let typeA = utils
    .capitalizeFirstLetter(utils.replaceAllInString(splat[0], "|", ""))
    .trim();
  type = utils.capitalizeFirstLetter(
    utils.replaceAllInString(splat[1], "|", "").trim()
  );
  if (typeA.split("[").length > 1) {
    typeA = "Array";
  }
  if (type.split("[").length > 1) {
    type = "Array";
  }
  type = `${utils.capitalizeFirstLetter(
    typeA
  )} || ${utils.capitalizeFirstLetter(type)}`;
  return type;
};
export const parseMongoVarlist = (vars: string[], uniques: string[]) => {
  const addUniqueVariant = (type: string) => {
    const uniqueVarString = `
            { type: ${type}, unique: true }
        `;
    return utils.replaceAllInString(uniqueVarString, "\n", "");
  };
  const checkIfUniqueVar = (varb: string, uniqueList: string[]) => {
    return uniqueList
      .map((variable) => variable.split(":")[0].toLowerCase())
      .includes(varb);
  };
  let varList = utils.splitNameType(vars);
  const schemaInterface: any = {};
  if (!Array.isArray(varList)) return { importList: [], varList };
  varList = varList.map((variable) => {
    let type = utils.removeLastWordFromString(variable.type, ["Type", "Input"]);
    if (parseUtils.isCustomType(type)) {
      type = "Object";
    }
    type = utils.replaceAllInString(type, "int", "number");
    type = utils.replaceAllInString(type, "Int", "number");
    type = utils.replaceAllInString(type, "date", "Date");
    type = arragenMongoTypes(type);
    schemaInterface[variable.name] = utils.capitalizeFirstLetter(type);
    if (checkIfUniqueVar(variable.name, uniques)) {
      schemaInterface[variable.name] = addUniqueVariant(type);
    }
    return { name: variable.name, type };
  });
  return { schemaInterface, varList };
};
//
