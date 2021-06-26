import execa from "execa";
import { allCustomTypes } from "../../consts";
import Logger from "../../logger/logger";

export const replaceAllInString = (str: string, find: string, replace: any) => {
  var escapedFind = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return str.replace(new RegExp(escapedFind, "g"), replace);
};
export const compileToVarList = (vars: string[] | [String]) => {
  return vars.map((variable) => {
    const splat = variable.split(":");
    const varb = splat[0];
    const varType = splat[1];
    return { var: varb, type: varType };
  });
};
export const capitalizeFirstLetter = (string: string | String) => {
  if (allCustomTypes.includes(string.trim())) return string;
  if (string[0] === "[")
    return "[" + string.charAt(1).toUpperCase() + string.slice(2);
  return string.charAt(0).toUpperCase() + string.slice(1);
};
export const fixTypes = (
  variable: { type: string; var: string },
  toUpperCase?: boolean,
  forSchema?: boolean
) => {
  if (allCustomTypes.includes(variable.type.trim())) {
    if (forSchema) return "Object";
    else return variable.type;
  }
  let lowerCaseVar = variable.type.trim().toLowerCase();
  lowerCaseVar = replaceAllInString(lowerCaseVar, "int", "number");
  lowerCaseVar = replaceAllInString(lowerCaseVar, "Int", "number");
  lowerCaseVar = replaceAllInString(lowerCaseVar, "date", "Date");
  if (toUpperCase) return capitalizeFirstLetter(lowerCaseVar);
  return lowerCaseVar;
};
export const applyPrettier = async (path?: string) => {
  try {
    path
      ? await execa(`npx prettier --write ${path}`)
      : await execa("npx prettier --write *.ts");
  } catch ({ message }) {
    Logger.error(`FROM: EPB-server: ${message}`);
  }
};
