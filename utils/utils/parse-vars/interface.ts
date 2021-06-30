import * as utils from "../../utils";
import * as parseUtils from "../parse-vars.util";

export const parseInterfaceVarlist = (vars: string[]) => {
  let varList = utils.splitNameType(vars);
  let importList: string[] = [];
  if (!Array.isArray(varList)) return { importList: [], varList };
  varList = varList.map((variable) => {
    let type = variable.type;
    if (parseUtils.isCustomType(type)) {
      importList.push(utils.removeLastWordFromString(type, ["Type", "Input"]));
    } else {
      type = type.toLowerCase();
    }
    type = parseUtils.parseArrayOperatorTypes(type);
    type = utils.replaceAllInString(type, "int", "number");
    type = utils.replaceAllInString(type, "Int", "number");
    type = utils.replaceAllInString(type, "date", "Date");
    return { name: variable.name, type };
  });
  return { importList, varList };
};
/* take an array of strings that look like this: "foo: int"
   and turn it into an array of { name: foo, type: int } and return it as varList
   also return importList - an array of custom types to import later in the interface's file.
   */
