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
  if (string[0] === "[")
    return "[" + string.charAt(1).toUpperCase() + string.slice(2);
  return string.charAt(0).toUpperCase() + string.slice(1);
};
