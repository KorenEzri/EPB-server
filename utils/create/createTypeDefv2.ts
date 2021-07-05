import {
  ResolverOptions,
  createCustomTypeOptions,
  createTypedefOptions,
} from "../../types";
import { typeDefs } from "../../typeDefs";
import { getTypeDefs } from "../codeToString";
import { promisify } from "util";
import Logger from "../../logger/logger";
import fs from "fs";
import * as utils from "../utils";
import * as parseVars from "../utils/parse-vars";
const write = promisify(fs.writeFile);

type typedefOptions =
  | ResolverOptions
  | createCustomTypeOptions
  | createTypedefOptions;
type varList = { name: string; type: string }[];

const createOnlyInlineVarlist = (
  varList: varList,
  allTypesAreCustomTypes: boolean,
  definitionName: string,
  definitionType: string
) => {
  let inlineVarlist;
  if (varList.length > 1) {
    // if it is > 1 that means we'll have a special interface for it, so we'll just call for it in the options: fooOptionsInput thing.
    inlineVarlist = `options: ${definitionName}Options${utils.capitalizeFirstLetter(
      definitionType
    )}`;
  } else {
    const { name, type } = varList[0];
    inlineVarlist = allTypesAreCustomTypes
      ? `(${name}: ${type})` // if all types are custom types, you really don't wanna change their names.
      : `(${name}:${utils.parseSingleTypedefVariable(varList[0])})`; // else, do that magic.
  }
  return inlineVarlist;
};
const createTypedefInterfaceVarListAndInlineVarlist = (
  varList: varList,
  objectName: string,
  returnsArray: boolean,
  allTypesAreCustomTypes: boolean,
  returnType: string
) => {
  const cleanTypedefInterface = (typeDefInterface: any) => {
    typeDefInterface = JSON.stringify(typeDefInterface, null, 2);
    typeDefInterface = utils.replaceAllInString(typeDefInterface, '"', "");
    return typeDefInterface;
  };
  const typeDefInterface: any = {};
  varList.forEach((variable) => {
    const { name, type } = variable;
    if (!name) return;
    typeDefInterface[name] = allTypesAreCustomTypes
      ? type
      : utils.parseSingleTypedefVariable(variable);
  });
  const returnTypePostfix = allTypesAreCustomTypes ? "" : "Type";
  const varListReturnType = returnType
    ? returnType
    : returnsArray
    ? `[${objectName}Options${returnTypePostfix}]`
    : `${objectName}Options${returnTypePostfix}`;

  return {
    inlineVarlist: `(options: ${objectName}OptionsInput): ${varListReturnType}`,
    typeDefInterface: cleanTypedefInterface(typeDefInterface),
  };
};
const createTypedefVarList = ({ options }: typedefOptions) => {
  const { properties, name, actionName, type, returnType } = options;
  let varList = utils.splitNameType(properties); // return a list of { name: foo, type: string } .
  Array.isArray(varList) ? varList : (varList = [varList]);
  const areAllTypesCustomTypes = utils.checkIfAllTypesAreCustomTypes(varList);
  // check if handling only custom types
  const moreThanOneVarInVarlist = varList.length > 1 ? true : false;
  // check if there's more than one variable for the varList to determine the need for an interface.
  const returnsArray = actionName?.includes("Many") ? true : false;
  // check if the type definition acting is supposed to return an array of something.
  const definitionType =
    type === "Query"
      ? "type"
      : type === "Mutation"
      ? "input"
      : type
      ? type
      : "input";
  const definitionReturnType = returnType ? returnType : "String";
  if (moreThanOneVarInVarlist) {
    // if more than one variable is required we need to create a typedef interface for it AND an inline type definition for options.
    return createTypedefInterfaceVarListAndInlineVarlist(
      varList,
      name,
      returnsArray,
      areAllTypesCustomTypes,
      definitionReturnType
    );
    // returns { inlineVarlist, typedefInterface }
  } else {
    const inlineVarlist = createOnlyInlineVarlist(
      // that will be the inline options:  querySomething(  >> options: fooOptionsInput <<  ): returnType
      varList,
      areAllTypesCustomTypes,
      name,
      definitionType
    );
    return { inlineVarlist, typeDefInterface: undefined };
  }
};
const createFirstLineOfTypedefInterface = ({ options }: typedefOptions) => {
  let { type, name } = options;
  type === "Mutation"
    ? (type = "input")
    : type === "Query"
    ? (type = "type")
    : type;
  return `${type} ${name}Options${utils.capitalizeFirstLetter(type || "")}`;
};
const createTypedefInterface = (options: typedefOptions) => {
  const firstLine = createFirstLineOfTypedefInterface(options);
  const { inlineVarlist, typeDefInterface } = createTypedefVarList(options);
  return {
    fullInterface: typeDefInterface ? firstLine + typeDefInterface : undefined,
    inlineVarlist,
  };
};
const buildTypedef = () => {};
const insertToTypedefs = async (
  typedefInterface: string | undefined,
  queryOrMutationDefinition: string | undefined
) => {
  return "";
};
export const createnewTypedef = async (options: typedefOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type definition...");
  const { inlineVarlist, fullInterface } = createTypedefInterface(options);
  console.log("varlist: ", inlineVarlist);
  console.log(" interface: ", fullInterface);
  // await insertToTypedefs(typeDefInterface, queryMutationDefinitionString);
};

/*
    inlineVarlist is what comes after the Query or Mutation declaration as options for that Query/Mutation. 
    for example: deleteAllMessages(options: deleteAllMessagesOptionsInput): String;
    In this Mutation definition, " options: deleteAllMessagesOptionsInput " is our inlineVarlist. 
    " deleteAllMessagesOptionsInput " is our typeDef interace, or "fullInterface" variable.

    Sometimes we will not need a whole interface for options, as there will be only one variable (or there won't be any at all) -
    that's when we'll get a query more like the following:

    getAllMessagesByDate(date: Date): [messageOptionsType] ;
    in this case, inlineVarlist is " (date: Date) ".
    */
