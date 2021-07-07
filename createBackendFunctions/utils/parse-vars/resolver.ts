import * as utils from "..";
import * as parseUtils from "../parse-vars.util";

export const parseResolverVarlist = (vars: string[]) => {
  let varList = utils.splitNameType(vars);
  let importList: string[] = [];
  const resolverInterface: any = vars.length < 3 ? undefined : { options: {} };
  if (!Array.isArray(varList)) return { importList, varList };
  varList = varList.map((variable) => {
    let type = utils.removeLastWordFromString(variable.type, ["Type", "Input"]);
    if (
      !parseUtils.isCustomType(type) &&
      !parseUtils.isCustomType(`${type}Input`) &&
      !parseUtils.isCustomType(`${type}Type`)
    ) {
      type = type.toLowerCase();
    } else {
      importList.push(type.split("[").join("").split("]").join(""));
    }

    type = parseUtils.parseArrayOperatorTypes(type);
    type = utils.replaceAllInString(type, "int", "number");
    type = utils.replaceAllInString(type, "Int", "number");
    type = utils.replaceAllInString(type, "date", "Date");
    if (resolverInterface) resolverInterface.options[variable.name] = type;
    return { name: variable.name, type };
  });
  return { resolverInterface, varList, importList };
};
//
