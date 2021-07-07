import {
  createCustomTypeOptions,
  createTypedefOptions,
  createResolverOptions,
} from "../../../../../types";
import * as mongoUtils from "../util";
import { promisify } from "util";
import Logger from "../../../../../logger/logger";
import fs from "fs";
import * as utils from "../../../../utils";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);
const getType = (type: string | undefined) => {
  return type === "Query"
    ? "type"
    : type === "Mutation"
    ? "input"
    : type
    ? type
    : "input";
};
type varList = { name: string; type: string }[];

const getTypedefInterfaceFromModelName = async (model: string) => {
  const filePath = `types/${model}Options.ts`;
  const interfaceFileLineArray = utils.toLineArray(
    await read(filePath, "utf8")
  );
  const typeDefInterface: any = {};
  let startIndex: number = -2,
    endIndex: number = -2;
  interfaceFileLineArray.forEach((line: string) => {
    if (line.includes("export interface") && startIndex === -2) {
      startIndex = interfaceFileLineArray.indexOf(line);
    } else if (line.includes("// added at:") && endIndex === -2) {
      endIndex = interfaceFileLineArray.indexOf(line);
    }
  });
  typeDefInterface.properties = interfaceFileLineArray
    .slice(startIndex + 2, endIndex - 2)
    .map((line: string) => utils.replaceAllInString(line.trim(), ",", ""));
  return typeDefInterface;
};
const createTypedefFromOpts = async (options: createResolverOptions) => {
  const modelNameOnly = utils.replaceAllInString(options.Model, "Schema", "");
  const typeDefInterface = await getTypedefInterfaceFromModelName(
    modelNameOnly
  );
  const lowerCaseAction = options.action.toLowerCase();
  const mutationQuery = mongoUtils.mutationCRUDS.includes(options.action);
  const returnType = mutationQuery
    ? "String"
    : lowerCaseAction.includes("many") || lowerCaseAction.includes("all")
    ? `[${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType]`
    : `${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType`;
  const type = mutationQuery ? "Mutation" : "Query";
  const createCustomTypeOptions: createCustomTypeOptions = {
    options: {
      properties: mutationQuery ? typeDefInterface.properties : undefined,
      name: modelNameOnly,
      comment: "Custom type created by CRUD generator",
      dbSchema: true,
      typeDef: true,
      returnType,
      type,
      tsInterface: "no",
      actionName: utils.lowercaseFirstLetter(options.action),
    },
  };
  return createCustomTypeOptions;
};
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
const createTypedefVarList = ({ options }: createCustomTypeOptions) => {
  const { properties, name, actionName, type, returnType } = options;
  let varList = utils.splitNameType(properties); // return a list of { name: foo, type: string } .
  Array.isArray(varList) ? varList : (varList = [varList]);
  const areAllTypesCustomTypes = utils.checkIfAllTypesAreCustomTypes(varList);
  // check if handling only custom types
  const moreThanOneVarInVarlist = varList.length > 1 ? true : false;
  // check if there's more than one variable for the varList to determine the need for an interface.
  const returnsArray = actionName?.includes("Many") ? true : false;
  // check if the type definition acting is supposed to return an array of something.
  const definitionType = getType(type);
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
const createFirstLineOfTypedefInterface = ({
  options,
}: createCustomTypeOptions) => {
  let { type, name } = options;
  type = getType(type);
  return `${type} ${name}Options${utils.capitalizeFirstLetter(type || "")}`;
};
const createTypedefInterface = (options: createCustomTypeOptions) => {
  const firstLine = createFirstLineOfTypedefInterface(options);
  const { inlineVarlist, typeDefInterface } = createTypedefVarList(options);
  return {
    fullInterface: typeDefInterface ? firstLine + typeDefInterface : undefined,
    inlineVarlist,
  };
};
const insertToTypedefs = async (
  typeDefInterface: string | undefined,
  queryOrMutationDefinition: string,
  type: string
) => {
  const typeDefsAsString = await read("typeDefs.ts", "utf8");
  const handlerA =
    type === "input" || "Mutation" ? "# mutation-end" : "# query-end";
  let typeDefs = utils.pushIntoString(
    typeDefsAsString,
    handlerA,
    0,
    queryOrMutationDefinition
  );
  typeDefs = utils.pushIntoString(
    typeDefs,
    "# generated definitions",
    0,
    typeDefInterface || ""
  );
  await write("typeDefs.ts", typeDefs);
};
export const createnewTypedef = async (options: createTypedefOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type definition...");
  const interfaceOptions = await createTypedefFromOpts(options.options);
  const { inlineVarlist, fullInterface } =
    createTypedefInterface(interfaceOptions);
  let { type, name } = interfaceOptions.options;
  if (!type) type = "Query";
  type = getType(type);
  const typeDefInterface = fullInterface
    ? JSON.stringify(fullInterface, null, 2)
    : undefined;
  const typeDefInterfaceName = `${type} ${name}Options${utils.capitalizeFirstLetter(
    type || ""
  )}`;
  const typeDefActionName = await insertToTypedefs(
    typeDefInterface,
    inlineVarlist,
    type
  );
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
