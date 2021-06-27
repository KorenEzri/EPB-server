import { ResolverOptions } from "../../types2";
import { getTypeDefs } from "../codeToString";
import Logger from "../../logger/logger";
import { promisify } from "util";
import fs from "fs";
import * as utils from "./utils";
import { createCustomTypeOptions } from "../../types2";
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
  return utils.insertToString(
    allTypeDefsAsString,
    typeDef,
    type || "type",
    "#"
  );
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
  const capitalizedReturnType = utils.capitalizeFirstLetter(returnType || "");
  let typeDef;
  if (!Array.isArray(varList)) {
    typeDef = `${name}(${varList}): ${capitalizedReturnType}`;
  } else {
    typeDef = `${name}: ${capitalizedReturnType}
    `;
  }
  return { typeDef, typeDefInterface };
};
const insertTypeDef = (
  splatTypeDefs: string[],
  name: string,
  typeDefInterface: any,
  type?: string
) => {
  let interfacePreFix;
  type === "query" ? (interfacePreFix = "type") : (interfacePreFix = "input");
  const index = splatTypeDefs.indexOf("# generated definitions");
  const interfaceString = JSON.stringify(typeDefInterface, null, 2);
  const typeDef = `\n ${interfacePreFix} ${name}Options ${interfaceString}\n# added at: ${new Date()}`;
  let finishedInterfaceDef = utils.replaceAllInString(typeDef, '"', "");
  splatTypeDefs.splice(index + 1, 0, finishedInterfaceDef);
  return splatTypeDefs;
};
export const createNewTypeDef = async ({
  options,
}: ResolverOptions | createCustomTypeOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type definition...");
  const res = await grabTypeDefsAndInsertNewTypeDef(
    options.name,
    options.properties,
    options.type,
    options.returnType
  );
  // calls fromOptionsToGQLTypeDefinition()
  if (typeof res === "string") return res;
  // if res === string => error occured.
  const { typeDefs, typeDefInterface } = res;
  let revisedTypeDefs = insertTypeDef(
    utils.toLineArray(typeDefs),
    options.name,
    typeDefInterface,
    options.type
  ).join("\n");
  revisedTypeDefs = utils.replaceAllInString(revisedTypeDefs, "Number", "Int");
  await write("./typeDefs.ts", revisedTypeDefs);
};
