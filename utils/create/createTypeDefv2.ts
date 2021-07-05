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

const createFirstLineOfTypedefInterface = ({ options }: typedefOptions) => {
  let { type, name } = options;
  type === "Mutation"
    ? (type = "input")
    : type === "Query"
    ? (type = "type")
    : type;
  return `${type} ${name}Options${utils.capitalizeFirstLetter(type || "")} {`;
};
const createTypedefInterface = (options: typedefOptions) => {
  const createTypedefVarList = ({ options }: typedefOptions) => {
    const createOnlyInlineVarlist = (
      varList: varList,
      allTypesAreCustomTypes: boolean
    ) => {
      const { name, type } = varList[0];
      const inlineVarlist = allTypesAreCustomTypes
        ? `${name}: ${type}`
        : `${name}:${utils.parseSingleTypedefVariable(varList[0])}`;
      return inlineVarlist;
    };
    const createTypedefInterfaceVarListAndInlineVarlist = (
      varList: varList,
      objectName: string,
      returnsArray: boolean,
      allTypesAreCustomTypes: boolean
    ) => {
      const typeDefInterface: any = {};
      varList.forEach((variable) => {
        const { name, type } = variable;
        if (!name) return;
        typeDefInterface[name] = allTypesAreCustomTypes
          ? type
          : utils.parseSingleTypedefVariable(variable);
      });
      const returnTypePostfix = allTypesAreCustomTypes ? "" : "Input";
      const returnType = returnsArray
        ? `[${objectName}Options${returnTypePostfix}]`
        : `${objectName}Options${returnTypePostfix}`;
      return {
        inlineVarlist: `options: ${returnType}`,
        typeDefInterface,
      };
    };
    const { properties, name, actionName } = options;
    let varList = utils.splitNameType(properties); // return a list of { name: foo, type: string } .
    Array.isArray(varList) ? varList : (varList = [varList]);
    const areAllTypesCustomTypes = utils.checkIfAllTypesAreCustomTypes(varList);
    const moreThanOneVarInVarlist = varList.length > 1 ? true : false;
    const returnsArray = actionName?.includes("Many") ? true : false;
    if (moreThanOneVarInVarlist) {
      const inlineVarlist = createOnlyInlineVarlist(
        varList,
        areAllTypesCustomTypes
      );
      return { inlineVarlist };
    } else {
      const inlineAndInterfaceVarlists =
        createTypedefInterfaceVarListAndInlineVarlist(
          varList,
          name,
          returnsArray,
          areAllTypesCustomTypes
        );
      return inlineAndInterfaceVarlists;
    }
  };
  const firstLine = createFirstLineOfTypedefInterface(options);
  const varList = createTypedefVarList(options);
  console.log("INTERFACE LIST (VARLIST) (NOT INLINE): ", varList);

  return {
    fullInterface:
      firstLine + JSON.stringify(varList.inlineVarlist, null, 2) + "}",
    inlineVarlist: varList,
  };
};
const createQueryOrMutationDefinition = ({ options }: typedefOptions) => {
  let { type, actionName, name, properties, returnType } = options;
  if (!actionName) actionName = "";
  actionName = utils.lowercaseFirstLetter(actionName);
  name = utils.capitalizeFirstLetter(name);
  if (returnType)
    returnType = utils.isCustomType(returnType)
      ? returnType
      : utils.capitalizeFirstLetter(returnType);
  const queryOrMutationString =
    type === "input" ? "Mutation" : type === "type" ? "Query" : type;
  const inlineDefinitionString =
    properties.length > 1
      ? (inlineVarlist: string) =>
          `${actionName}${name}(options: ${inlineVarlist}): ${returnType}`
      : (inlineVarlist: string) =>
          `${actionName}${name}(${inlineVarlist}): ${returnType}`;
  const definition = {
    queryOrMutationString,
    inlineDefinitionString,
  };
  return definition;
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
  const {
    options: { properties },
  } = options;
  if (properties.length > 1) {
    let { inlineVarlist, fullInterface } = createTypedefInterface(options);
    const { queryOrMutationString, inlineDefinitionString } =
      createQueryOrMutationDefinition(options);
    const queryMutationInlineVarDefinitionString = inlineDefinitionString(
      inlineVarlist.inlineVarlist
    );
    console.log("ACTION STRING: ", queryOrMutationString);
    console.log("FUll Interface: ", fullInterface);
    console.log(
      "Inline ACTION variables: ",
      queryMutationInlineVarDefinitionString
    );

    // await insertToTypedefs(typeDefInterface, queryMutationDefinitionString);
  }
};
