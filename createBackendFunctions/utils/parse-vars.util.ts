import { allCustomTypesWithArrayTypes, validTypes } from "../../consts";
import * as utils from ".";

// for graphQL types I add "Type" || "Input" accordingly to definition names,
// so users can make both type and input definitions.
export const isCustomType = (type: string) => {
  if (type.toLowerCase() === "date") return false;
  return allCustomTypesWithArrayTypes.includes(type) ? true : false;
};
// checks if the type is a custom type (IE an existing type that is not string, number, etc)
export const addToCustomTypes = (name: string, gqlType: string) => {
  allCustomTypesWithArrayTypes.push(name);
  allCustomTypesWithArrayTypes.push(`${name}[]`);
  allCustomTypesWithArrayTypes.push(`[${name}]`);
  allCustomTypesWithArrayTypes.push(`${name}Options`);
  allCustomTypesWithArrayTypes.push(`${name}Options[]`);
  allCustomTypesWithArrayTypes.push(`[${name}Options]`);
  allCustomTypesWithArrayTypes.push(`${name}Options${gqlType}[]`);
  allCustomTypesWithArrayTypes.push(`[${name}Options${gqlType}]`);
  allCustomTypesWithArrayTypes.push(`[${name}Options${gqlType}]`);
};
export const parseArrayOperatorTypes = (type: string, gqlArray?: boolean) => {
  if (type.includes("[") && type.includes("]")) {
    let typeString: string | string[] = type.split("[").join("").split("]");
    typeString = gqlArray ? `[${typeString.join("")}]` : typeString + "[]";
    typeString = gqlArray ? typeString : typeString.split(",").join("");
    return typeString;
  } else return type;
};

export const checkIfAllTypesAreCustomTypes = (
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
export const parseSingleTypedefVariable = (variable: {
  name: string;
  type: string;
}) => {
  let { name, type } = variable;
  if (!name && !type) return "";
  if (utils.isCustomType(type)) return `${name}:${type}`;
  const capType = utils.capitalizeFirstLetter(type);
  type = utils.parseArrayOperatorTypes(capType, true);
  return type;
};
