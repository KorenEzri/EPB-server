import { allCustomTypesWithArrayTypes, validTypes } from "../../consts";
import * as utils from ".";
import Logger from "../../logger/logger";

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
export const getAllAllowedTypes = () => {
  return allCustomTypesWithArrayTypes.concat(validTypes);
};
