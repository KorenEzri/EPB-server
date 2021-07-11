import { mutationCRUDS } from "../prebuiltActions/crudOperations/mongodb/util";
import { ResolverOptions, createCustomTypeOptions } from "../../types";
import { typeDefs } from "../../typeDefs";
import { getTypeDefs } from "../codeToString";
import { promisify } from "util";
import Logger from "../../logger/logger";
import fs from "fs";
import * as utils from "../utils";
import * as parseVars from "../utils/parse-vars";
const write = promisify(fs.writeFile);
const allTypeDefinitions = typeDefs.definitions.map((definition: any) =>
  definition.name.value.trim()
);
const grabTypeDefsAndInsertNewTypeDef = async (
  name: string,
  properties: string[],
  type?: string,
  returnType?: string,
  actionName?: string
) => {
  const capType = utils.capitalizeFirstLetter(type || "");
  let { typeDef, typeDefInterface } = await fromOptionsToGQLTypeDefinition(
    /*
    This function returns varList - either an array, or a stringified represntation of name:type in case of having only one option.
    it also returns typeDefInterface - which is either undefined, or an object, represting a whole type definition interface
    for GraphQL.
    */
    name,
    properties,
    capType,
    returnType,
    actionName
  );
  const allTypeDefsAsString = await getTypeDefs(); // current typeDef file as string
  if (!allTypeDefsAsString)
    return "Error with utils/createNew/createTypeDef.ts, getTypeDefs() returned undefined!";
  const typeDefLineArray = utils.toLineArray(allTypeDefsAsString);
  if (
    !actionName &&
    // check if typeDef already exists vv
    (typeDefLineArray.includes(typeDef) ||
      utils.isCustomType(`${name}Options`) ||
      allTypeDefinitions.includes(`${name.trim()}Options`))
  ) {
    // check if typeDef is a custom type vv
    if (type && utils.isCustomType(`${name}Options${capType}`)) {
      return { error: "Duplicate type definitions detected, aborting.." };
    }
    // if it's not a custom type, but already exists, also abort. vv
    return { error: "Duplicate type definitions detected, aborting.." };
  } else {
    // add it to custom types and validation lists so the validation list is updated without having to restart the server
    // (because new files were created, and now, it IS in fact a custom type, unlike before.)
    utils.addToCustomTypes(name.trim(), capType);
    allTypeDefinitions.push(`${name.trim()}Options`);
    allTypeDefinitions.push(`${name.trim()}Options${capType}`);
  }

  let finishedTypeDefs = await insertTypeDefInterface(
    // this inserts the interface to the typeDef string.
    allTypeDefsAsString,
    name,
    typeDefInterface,
    type,
    returnType
  );

  let typeInsertEndIndex: string | number =
    type === "Query" ? "# query-end" : "# mutation-end";
  typeInsertEndIndex = utils
    .toLineArray(finishedTypeDefs)
    .map((line: string) => line.trim())
    .indexOf(typeInsertEndIndex);
  if (actionName) typeDef = actionName + utils.capitalizeFirstLetter(typeDef);
  if (returnType) {
    finishedTypeDefs = utils.pushIntoString(
      finishedTypeDefs,
      typeInsertEndIndex,
      0,
      typeDef
    );
  }
  return finishedTypeDefs;
};
const fromOptionsToGQLTypeDefinition = async (
  name: string,
  properties: string[],
  type: string,
  returnType?: string,
  actionName?: string
) => {
  const typeDefForManyObjects =
    actionName?.toLowerCase().includes("many") ||
    actionName?.toLowerCase().includes("all")
      ? true
      : false;
  // Function receives the name of the type Def, the list of it's properties, and it's returntype (optional)
  const { varList, typeDefInterface } = parseVars.parseTypeDefVarlist(
    /*
    This function returns varList - either an array, or a stringified represntation of name:type in case of having only one option.
    it also returns typeDefInterface - which is either undefined, or an object, represting a whole type definition interface
    for GraphQL.
    */
    properties,
    name
  );
  if (returnType) {
    if (!utils.isCustomType(returnType)) {
      returnType = utils.capitalizeFirstLetter(returnType);
    }
  }
  let typeDef;
  if (!Array.isArray(varList)) {
    /* if varList is not an array, that means we only have one variable to handle,
     so it's placed inside the Query/Mutation definition itself.
     if the varList is an array, we use typeDefInterface, and it will be inserted later.
    */
    returnType
      ? (typeDef = `${name}${
          typeDefForManyObjects ? "s" : ""
        }(${varList}): ${returnType}`)
      : (typeDef = `${type.toLowerCase()} ${name} {${varList}}`);
    /* this^^^^ is like:
                  getMessageOptions(message: messageOptionsInput): messageOptionsType
    */
  } else if (varList.length === 0) {
    return {
      typeDef: `${name}${typeDefForManyObjects ? "s" : ""}: ${returnType}`,
      typeDefInterface,
    };
  } else {
    typeDef = `${name}${typeDefForManyObjects ? "s" : ""}: ${returnType}`; // this <<< is like:
    // getMessageOptions: messsageOptionsType
    // later, it will get the typeDefInterface options added to it.
  }

  return { typeDef, typeDefInterface };
};
const insertTypeDefInterface = async (
  typeDefs: string,
  name: string,
  typeDefInterface: any,
  type?: string,
  returnType?: string
) => {
  // insert the type definition to the typeDef file string.
  let interfacePreFix;
  // every graphQL interface has a prefix: either 'type' or 'input'.
  // Queries get 'type', while Mutations get 'input'.
  type === "Query"
    ? (interfacePreFix = "type")
    : type === "type"
    ? (interfacePreFix = type)
    : type === "input"
    ? (interfacePreFix = "input")
    : (interfacePreFix = "type");
  if (returnType) interfacePreFix = "input";
  const handlerA = "# generated definitions"; // handler for position to insert typeDef
  const interfaceString = JSON.stringify(typeDefInterface, null, 2);
  /*
  does interfaceString exist? if so, create something like:
   
  type fooOptionsType {
    foo: String
    bar: [Int]
  }
  # added at: 06.30.2021..

  if interfaceString doesn't exist, don't create an interface!

  */
  let typeDef = interfaceString
    ? `\n ${interfacePreFix} ${name}Options${utils.capitalizeFirstLetter(
        interfacePreFix
      )} ${interfaceString}\n# added at: ${new Date()}`
    : undefined;
  typeDef = utils.replaceAllInString(
    typeDef || "",
    ['"', "Number", ";"],
    ["", "Int", ""]
    // self-explanatory - GQL needs type "Int", not "Number", but for comfort, users can input both.
  );
  const checkForDuplicates = await utils.checkIfLinesAlreadyExist(
    typeDef,
    undefined,
    typeDefs
  );
  if (checkForDuplicates.error) typeDef = "";
  const finishedTypeDefs = utils.pushIntoString(
    // push into a string:
    typeDefs, // All old typeDefs file as string, we are pushing to this string.
    handlerA, // handlerA - # generated definitions - for positioning.
    0, // handlerB for pushIntoString() function - meaning, add the string we want to add, but delete nothing.
    typeDef // the string to push - typeDef.
  );
  return finishedTypeDefs;
};
export const createNewTypeDef = async ({
  options,
}: ResolverOptions | createCustomTypeOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type definition...");
  try {
    const res: any = await grabTypeDefsAndInsertNewTypeDef(
      options.name,
      options.properties,
      options.type,
      options.returnType,
      options.actionName
    );
    // calls fromOptionsToGQLTypeDefinition()
    if (!res || res.error) {
      Logger.error(`Error creating type definition! ${res.error}`);
      if (res.error) return res.error;
      return res;
    }
    await write("./typeDefs.ts", res);
    if (options.properties.length > 1) {
      await addToConfigFile(options.name);
    }
    if (options.returnType) {
      await utils.alterConfigFile("add", "typeDefActions", options.name);
    }
    return "OK";
  } catch ({ message }) {
    Logger.error(
      `From: EPB-server: Error creating type definition, ${message}`
    );
    return message;
  }
};

const addToConfigFile = async (typeName: string) => {
  const names = getNamesFromTypeName(typeName);
  await utils.alterConfigFile(
    "add",
    "typeDefInterfaces",
    names.typeDefInterfaceName
  );
};

const getActionName = (typeName: string, action?: string) => {
  if (!action) return;
  action = utils.lowercaseFirstLetter(action.split(" ").join(""));
  if (action.includes("Many")) return `${action}${typeName}s`;
  return `${action}${typeName}`;
};
const getTypedefInterfaceName = (typeName: string, action?: string) => {
  if (!action) action = "";
  action = action.split(" ").join("");
  if (mutationCRUDS.includes(action)) {
    return `${typeName}OptionsInput`;
  } else return `${typeName}OptionsType`;
};
const getNamesFromTypeName = (typeName: string, action?: string) => {
  const schemaName = `${typeName}Schema`;
  const modelName = `${typeName}Model`;
  const customTypeName = `${typeName}Options`;
  const actionName = getActionName(typeName, action);
  const typeDefInterfaceName = getTypedefInterfaceName(typeName, action);
  return {
    schemaName,
    modelName,
    customTypeName,
    actionName,
    typeDefInterfaceName,
  };
};
