import { allCustomTypesWithArrayTypes } from "../../consts";
import * as utils from ".";

// for graphQL types I add "Type" || "Input" accordingly to definition names,
// so users can make both type and input definitions.
export const isCustomType = (type: string) => {
  if (type.toLowerCase() === "date") return false;
  return allCustomTypesWithArrayTypes.includes(type) ? true : false;
};
// checks if the type is a custom type (IE an existing type that is not string, number, etc)

export const addToCustomTypes = (type: string) => {
  allCustomTypesWithArrayTypes.push(type);
  allCustomTypesWithArrayTypes.push(`${type}[]`);
  allCustomTypesWithArrayTypes.push(`[${type}]`);
  allCustomTypesWithArrayTypes.push(`${type}Options`);
  allCustomTypesWithArrayTypes.push(`${type}Options[]`);
  allCustomTypesWithArrayTypes.push(`[${type}Options]`);
};

export const parseArrayOperatorTypes = (type: string, gqlArray?: boolean) => {
  if (type.includes("[") && type.includes("]")) {
    let typeString: string | string[] = type.split("[").join("").split("]");
    typeString = gqlArray ? `[${typeString.join("")}]` : typeString + "[]";
    typeString = gqlArray ? typeString : typeString.split(",").join("");
    return typeString;
  } else return type;
};

export const parseInterfaceVarlist = (vars: string[]) => {
  let varList = utils.splitNameType(vars);
  let importList: string[] = [];
  if (!Array.isArray(varList)) return { importList: [], varList };
  varList = varList.map((variable) => {
    let type = variable.type;
    if (isCustomType(type)) {
      importList.push(utils.removeLastWordFromString(type, ["Type", "Input"]));
    } else {
      type = type.toLowerCase();
    }
    type = parseArrayOperatorTypes(type);
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
    let type = utils.removeLastWordFromString(variable.type, ["Type", "Input"]);
    if (!isCustomType(type)) {
      type = type.toLowerCase();
    }
    type = utils.replaceAllInString(type, "int", "number");
    type = utils.replaceAllInString(type, "Int", "number");
    type = utils.replaceAllInString(type, "date", "Date");
    if (resolverInterface) resolverInterface.options[variable.name] = type;
    return { name: variable.name, type };
  });
  return { resolverInterface, varList };
};
//
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
    if (isCustomType(type)) {
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
export const parseTypeDefVarlist = (vars: string[], name: string) => {
  const varList = utils.splitNameType(vars);
  const typeDefAsInterface: any = vars.length < 1 ? undefined : {};
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
      if (typeDefAsInterface) {
        typeDefAsInterface[name] = parseArrayOperatorTypes(
          capitalizedType,
          true
        );
      }
      return `${name}:${capitalizedType}`;
    }
  });
  if (typeDefAsInterface) {
    return {
      varList: `options: ${name}Options`,
      typeDefInterface: typeDefAsInterface,
    };
  } else {
    return {
      varList: variableStringList,
      typeDefInterface: typeDefAsInterface,
    };
  }
};
//takes a string[] of foo:type elements and parses it, returns varList - ['foo:Type', 'bar:Type'] and typeDefInterface.
