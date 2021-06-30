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
// export const parseTypeDefVarlist = (vars: string[], name: string) => {
//   let varList = utils.splitNameType(vars); // return a list of { name: foo, type: string } .
//   const typeDefInterface: any = vars.length > 1 ? undefined : {}; // if more than one var, make an interface, else, don't.
//   /*
//   if we have more than one property, create a type definition especially for the custom type.
//    else, we'll just add the property as params in the query/mutation.
//   */
//   if (Array.isArray(varList)) {
//     const areAllVarsCustomTypes = varList.map((variable) => {
//       if (utils.isCustomType(`${variable.type}`)) {
//         return "custom";
//       } else return "not_custom";
//     });
//     if (!areAllVarsCustomTypes.includes("not_custom"))
//       if (varList.length > 1) {
//         varList.forEach((variable) => {
//           typeDefInterface[variable.name] = variable.type;
//         });
//         return {
//           varList: `options: ${name}OptionsInput`,
//           typeDefInterface: typeDefInterface,
//         };
//       } else {
//         try {
//           return {
//             varList: `${varList[0].name}:${varList[0].type}`,
//           };
//         } catch ({ message }) {
//           if (message !== "Cannot read property 'name' of undefined")
//             Logger.error(message);
//         }
//       }
//   }
//   if (!Array.isArray(varList))
//     return { varList: "", typeDefInterface: typeDefInterface };
//   const variableStringList = varList.map((variable) => {
//     const { type, name } = variable;
//     if (isCustomType(type)) {
//       if (typeDefInterface) typeDefInterface[name] = type;
//       // if it's a custom type, we want to leave it be and just add it to the definition.
//       return `${name}:${type}`;
//     } else {
//       console.log(varList);
//       // if it's not, we want to capitalize it's first letter, as per GQL syntax.
//       const capitalizedType = utils.capitalizeFirstLetter(type);
//       if (typeDefInterface) {
//         console.log("IN HERE");
//         typeDefInterface[name] = parseArrayOperatorTypes(capitalizedType, true);
//       }
//       console.log("HERE");
//       return `${name}:${capitalizedType}`;
//     }
//   });
//   if (typeDefInterface) {
//     return {
//       varList: `options: ${name}Options`,
//       typeDefInterface: typeDefInterface,
//     };
//   } else {
//     return {
//       varList: variableStringList,
//       typeDefInterface: typeDefInterface,
//     };
//   }
// };
// //takes a string[] of foo:type elements and parses it, returns varList - ['foo:Type', 'bar:Type'] and typeDefInterface.
