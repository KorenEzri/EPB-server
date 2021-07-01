import * as utils from "../../utils";

const checkIfAllTypesAreCustomTypes = (
  variables: { name: string; type: string }[]
) => {
  const areAllVarsCustomTypes = variables.map((variable) => {
    if (utils.isCustomType(`${variable.type}`)) {
      return "custom";
    } else return "not_custom";
  });
  if (!areAllVarsCustomTypes.includes("not_custom"))
    // if there is no 'not_custom' at all in the arrray, all are custom types.
    return true;
  else return false;
};
const compileVarlistAndTypedefInterfaceForCustomTypes = (
  varList: { name: string; type: string }[],
  name: string
) => {
  const amountOfVars = varList.length;
  const typeDefInterface: any = {};
  if (amountOfVars === 0)
    return {
      varList,
      typeDefInterface: undefined,
    };
  const moreThanOneVarInVarlist = amountOfVars > 1 ? true : false;
  if (!moreThanOneVarInVarlist) {
    const { type, name } = varList[0];
    return {
      varList: `${name}:${type}`,
    };
  }
  varList.forEach((variable) => {
    const { name, type } = variable;
    typeDefInterface[name] = type;
  });
  return {
    varList: `options: ${name}Options`,
    typeDefInterface,
  };
};
const parseSingleTypedefVariable = (variable: {
  name: string;
  type: string;
}) => {
  let { name, type } = variable;
  if (utils.isCustomType(type)) return `${name}:${type}`;
  const capType = utils.capitalizeFirstLetter(type);
  type = utils.parseArrayOperatorTypes(capType, true);
  return type;
};
const compileVarlistAndTypedefInterface = (
  varList: { name: string; type: string }[],
  name: string
) => {
  const typeDefInterface: any = {};
  const moreThanOneVarInVarlist = varList.length > 1 ? true : false;
  if (!moreThanOneVarInVarlist) {
    return {
      varList: `${varList[0].name}:${parseSingleTypedefVariable(varList[0])}`,
    };
  } else {
    varList.forEach((variable) => {
      typeDefInterface[variable.name] = parseSingleTypedefVariable(variable);
    });
    return {
      varList: `options: ${name}OptionsInput`,
      typeDefInterface,
    };
  }
};
export const parseTypeDefVarlist = (vars: string[], name: string) => {
  let varList = utils.splitNameType(vars); // return a list of { name: foo, type: string } .
  Array.isArray(varList) ? varList : (varList = [varList]);
  const areAllTypesCustomTypes = checkIfAllTypesAreCustomTypes(varList);
  if (areAllTypesCustomTypes) {
    return compileVarlistAndTypedefInterfaceForCustomTypes(varList, name);
  } else {
    return compileVarlistAndTypedefInterface(varList, name);
  }
};
