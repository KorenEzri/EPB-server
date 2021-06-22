import { ResolverOptions } from "../../types";
import * as utils from "./string.util";
import { promisify } from "util";
import fs from "fs";
import { getTypeDefs } from "../codeToString";
import Logger from "../../logger/logger";
const write = promisify(fs.writeFile);

let typeDefInterface: any = {};
const toTypeDef = ({ options }: ResolverOptions) => {
  const { name, returnType, properties } = options;
  let varList;
  varList = utils.compileToVarList(properties);
  if (properties.length < 3) {
    varList = varList.map((variable) => {
      return `${variable.var}:${utils.capitalizeFirstLetter(variable.type)}`;
    });
  } else {
    varList.forEach((variable) => {
      typeDefInterface[variable.var] = utils.capitalizeFirstLetter(
        variable.type.trim()
      );
    });
    varList = `options: ${name}Options`;
  }
  let typeDef;
  properties.length
    ? (typeDef = `${name}(${varList}): ${utils.capitalizeFirstLetter(
        returnType
      )}`)
    : (typeDef = `${name}: ${utils.capitalizeFirstLetter(returnType)}
    `);
  return typeDef;
};
const insertTypeDef = (
  splatTypeDefs: string[],
  name: String,
  type: string | String
) => {
  let interfacePreFix;
  type === "query" ? (interfacePreFix = "type") : (interfacePreFix = "input");
  if (!Object.values(typeDefInterface).length) return splatTypeDefs;
  const index = splatTypeDefs.indexOf("# generated definitions");
  const interfaceString = `\n ${interfacePreFix} ${name}Options ${JSON.stringify(
    typeDefInterface,
    null,
    2
  )}\n# added at: ${new Date()}`;
  let finishedInterfaceDef = utils.replaceAllInString(interfaceString, '"', "");
  splatTypeDefs.splice(index + 1, 0, finishedInterfaceDef);
  return splatTypeDefs;
};
export const createNewTypeDef = async ({ options }: ResolverOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type definition...");
  // compile a type definition string from options
  const fullTypeDef = toTypeDef({ options: options });
  const typeDefs = await getTypeDefs(); // current typeDef file as string
  if (!typeDefs) return "ERROR";
  const splatTypeDefs = typeDefs.split("\n").map((line: string) => line.trim());
  let indexToPush; // The index (line number) in which the next typeDef is meant to enter.
  options.type.toLowerCase() === "mutation" // mutation or query? different line number
    ? (indexToPush = splatTypeDefs.indexOf("# mutation-end"))
    : (indexToPush = splatTypeDefs.indexOf("# query-end"));
  // push into line indexToPush the compiled typeDef.
  if (!splatTypeDefs.includes(fullTypeDef))
    splatTypeDefs.splice(indexToPush, 0, fullTypeDef);
  // insert input type / query type (interface) into typeDefs if needed
  let revisedTypeDefs = insertTypeDef(
    splatTypeDefs,
    options.name,
    options.type
  ).join("\n");
  revisedTypeDefs = utils.replaceAllInString(revisedTypeDefs, "Number", "Int");
  await write("./typeDefs.ts", revisedTypeDefs);
};
export const createNewTypeOnly = async (options: any) => {};
