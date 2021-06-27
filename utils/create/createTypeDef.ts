import { ResolverOptions, createCustomTypeOptions } from "../../types";
import { getTypeDefs } from "../codeToString";
import Logger from "../../logger/logger";
import { promisify } from "util";
import fs from "fs";
import * as utils from "../utils";
import { toLineArray } from "../utils";
const write = promisify(fs.writeFile);

const grabTypeDefsAndInsertNewTypeDef = async (
  name: string,
  properties: string[],
  type?: string,
  returnType?: string
) => {
  const { typeDef, typeDefInterface } = fromOptionsToGQLTypeDefinition(
    name,
    properties,
    returnType
  );
  const allTypeDefsAsString = await getTypeDefs(); // current typeDef file as string
  if (!allTypeDefsAsString)
    return "Error with utils/createNew/createTypeDef.ts, getTypeDefs() returned undefined!";
  const typeDefLineArray = utils.toLineArray(allTypeDefsAsString);
  if (typeDefLineArray.includes(typeDef))
    // check if typeDef already exists
    return "Duplicate type definitions detected, aborting..";
  let finishedTypeDefs = insertTypeDefInterface(
    allTypeDefsAsString,
    name,
    typeDefInterface,
    type,
    returnType
  );
  let typeInsertEndIndex: string | number =
    type === "Query" ? "# query-end" : "# mutation-end";
  typeInsertEndIndex = toLineArray(finishedTypeDefs)
    .map((line: string) => line.trim())
    .indexOf(typeInsertEndIndex);
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
const fromOptionsToGQLTypeDefinition = (
  name: string,
  properties: string[],
  returnType?: string
) => {
  const { varList, typeDefInterface } = utils.parseTypeDefVarlist(
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
    typeDef = `${name}(${varList}): ${returnType}`;
  } else {
    typeDef = `${name}: ${returnType}
    `;
  }
  return { typeDef, typeDefInterface };
};
const insertTypeDefInterface = (
  typeDefs: string,
  name: string,
  typeDefInterface: any,
  type?: string,
  returnType?: string
) => {
  let interfacePreFix;
  type === "Query" ? (interfacePreFix = "type") : (interfacePreFix = "input");
  if (returnType) interfacePreFix = "input";
  const handlerA = "# generated definitions";
  const interfaceString = JSON.stringify(typeDefInterface, null, 2);
  const typeDef = `\n ${interfacePreFix} ${name}Options ${interfaceString}\n# added at: ${new Date()}`;
  let finishedInterfaceDef = utils.replaceAllInString(
    typeDef,
    ['"', "Number"],
    ["", "Int"]
  );
  const finishedTypeDefs = utils.pushIntoString(
    typeDefs,
    handlerA,
    0,
    finishedInterfaceDef
  );
  return finishedTypeDefs;
};
export const createNewTypeDef = async ({
  options,
}: ResolverOptions | createCustomTypeOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type definition...");
  try {
    const res = await grabTypeDefsAndInsertNewTypeDef(
      options.name,
      options.properties,
      options.type,
      options.returnType
    );
    // calls fromOptionsToGQLTypeDefinition()
    if (!res) {
      Logger.error("Error creating type definition!");
      return res;
    }
    await write("./typeDefs.ts", res);
    return "OK";
  } catch ({ message }) {
    Logger.error(
      `From: EPB-server: Error creating type definition, ${message}`
    );
    return message;
  }
};
