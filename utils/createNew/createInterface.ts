import { createCustomTypeOptions, ResolverOptions } from "../../types";
import Logger from "../../logger/logger";
import { checkIfOK } from "../codeToString";
import * as utils from "./string.util";
import { promisify } from "util";
import fs from "fs";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

export const insert_Into_Types_Index_TS = async (exportStatement: string) => {
  const typeIndexPath = "./types/index.ts";
  try {
    const isOK = await checkIfOK(typeIndexPath);
    if (!isOK) return "ERROR";
    const typeIndexFile = await read(typeIndexPath, "utf8");
    try {
      const assorted = typeIndexFile.split("\n");
      if (!assorted.includes(exportStatement)) assorted.push(exportStatement);
      await write(typeIndexPath, assorted.join("\n"));
    } catch ({ message }) {
      Logger.error(message);
      return "ERROR";
    }
  } catch ({ message }) {
    Logger.error(message);
    return "ERROR";
  }
};
const toInterface = ({ options }: createCustomTypeOptions) => {
  let interfaceString: any = {};
  let varList;
  const { properties, name } = options;
  varList = utils.compileToVarList(properties);
  interfaceString.options = {};
  varList.forEach((variable) => {
    let lowerCaseVar = variable.type.trim().toLowerCase();
    if (lowerCaseVar === "int" || lowerCaseVar === "[int]") {
      lowerCaseVar = "number";
    } else if (lowerCaseVar === "[int]") {
      lowerCaseVar = "[number]";
    } else if (lowerCaseVar === "date" || lowerCaseVar === "[date]") {
      lowerCaseVar = utils.capitalizeFirstLetter(lowerCaseVar);
    }
    interfaceString.options[variable.var] = lowerCaseVar;
  });
  varList = `{ options }:${name}Options`;
  interfaceString = `export interface ${name}Options ${JSON.stringify(
    interfaceString,
    null,
    2
  )}\n// added at: ${new Date()}`;
  return interfaceString;
};
const insertInterface = async (name: String, interfaceString: any) => {
  if (!Object.values(interfaceString).length) return;
  await write(
    `./types/${name}Options.ts`,
    utils.replaceAllInString(interfaceString, '"', "")
  );
  const res = await insert_Into_Types_Index_TS(
    `export * from "./${name}Options"`
  );
  return res;
};
export const createNewInterface = async ({
  options,
}: createCustomTypeOptions) => {
  const compiledInterface = toInterface({ options: options });
  try {
    await insertInterface(options.name, compiledInterface);
    const { dbSchema, typeDef } = options;
    return "OK";
  } catch ({ message }) {
    return message;
  }
};
