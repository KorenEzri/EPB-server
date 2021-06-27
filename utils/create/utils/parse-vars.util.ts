import { allCustomTypes } from "../../../consts";
import * as utils from "./";

const removeTypePostfix = (string: string) => {
  if (string.includes("Type")) {
    string = string.split("Type")[0];
  }
  if (string.includes("Input")) {
    string = string.split("Input")[0];
  }
  return string;
};
// for graphQL types I add "Type" || "Input" accordingly to definition names,
// so users can make both type and input definitions.
export const isCustomType = (type: string) => {
  return allCustomTypes.includes(type) ? true : false;
};
// checks if the type is a custom type (IE an existing type that is not string, number, etc)

export const parseInterfaceVarlist = (vars: string[]) => {
  let varList = utils.splitNameType(vars);
  let importList: string[] = [];
  if (!Array.isArray(varList)) return { importList: [], varList };
  varList = varList.map((variable) => {
    let type = variable.type;
    if (isCustomType(type)) {
      importList.push(type);
    } else {
      type = removeTypePostfix(type).toLowerCase();
    }
    type = utils.replaceAllInString(type, "int", "number");
    type = utils.replaceAllInString(type, "Int", "number");
    type = utils.replaceAllInString(type, "date", "Date");
    return { name: variable.name, type };
  });
  return { importList, varList };
};
// take an array of strings that look like this: "foo: int"
// and turn it into an array of { name: foo, type: int } and return it as varList
// also return importList - an array of custom types to import later in the interface's file.
export const parseResolverVarlist = (vars: string[]) => {
  let varList = utils.splitNameType(vars);
  const resolverInterface: any = vars.length < 3 ? undefined : { options: {} };
  if (!Array.isArray(varList)) return { importList: [], varList };
  varList = varList.map((variable) => {
    let type = removeTypePostfix(variable.type);
    if (!isCustomType(type)) {
      type = type.toLowerCase();
    }
    type = utils.replaceAllInString(type, "int", "number");
    type = utils.replaceAllInString(type, "Int", "number");
    type = utils.replaceAllInString(type, "date", "Date");
    resolverInterface.options[variable.name] = type;
    return { name: variable.name, type };
  });
  return { resolverInterface, varList };
};
//
export const parseMongoVarlist = (vars: string[]) => {};
//
export const parseTypeDefVarlist = (vars: string[], name: string) => {
  const varList = utils.splitNameType(vars);
  const typeDefAsInterface: any = vars.length < 3 ? undefined : {};
  // if we have more than three properties, create a type definition especially for the custom type.
  // else, we'll just add the properties as params in the query/mutation.
  if (!Array.isArray(varList))
    return { varList: [], typeDefInterface: typeDefAsInterface };
  const variableStringList = varList.map((variable) => {
    const { type, name } = variable;
    if (isCustomType(type)) {
      if (typeDefAsInterface) typeDefAsInterface[name] = type;
      // if it's a custom type, we want to leave it be and just add it to the definition.
      return `${name}:${type}`;
    } else {
      // if it's not, we want to capitalize it's first letter, as per GQL syntax.
      const capitalizedType = utils.capitalizeFirstLetter(type);
      if (typeDefAsInterface) typeDefAsInterface[name] = capitalizedType;
      return `${name}:${capitalizedType}`;
    }
  });
  if (typeDefAsInterface) {
    return {
      varList: `options: ${name}Options`,
      typeDefInterface: typeDefAsInterface,
    };
  } else
    return {
      varList: variableStringList,
      typeDefInterface: typeDefAsInterface,
    };
};
//takes a string[] of foo:type elements and parses it, returns varList - ['foo:Type', 'bar:Type'] and typeDefInterface.
