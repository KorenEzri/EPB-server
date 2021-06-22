import { createCustomTypeOptions, ResolverOptions } from "../../types";
import Logger from "../../logger/logger";
import { checkIfOK, getTypeDefs } from "../codeToString";
import * as utils from "./string.util";
import { promisify } from "util";
import fs from "fs";
import execa from "execa";

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
    const lowerCaseVar = utils.fixTypes(variable);
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
  let finishedInterface = utils.replaceAllInString(interfaceString, '"', "");
  finishedInterface = utils.replaceAllInString(finishedInterface, "||", "|");
  await write(`./types/${name}Options.ts`, finishedInterface);
  const res = await insert_Into_Types_Index_TS(
    `export * from "./${name}Options"`
  );
  return res;
};
const createInterface = (props: string[], name: string) => {
  let varList;
  let typeDefInterface: any = {};
  varList = utils.compileToVarList(props);
  varList.forEach((variable) => {
    typeDefInterface[variable.var] = utils.capitalizeFirstLetter(
      variable.type.trim()
    );
  });
  varList = `options: ${name}Options`;
  return { varList, typeDefInterface };
};
const createTypeDef = async (
  { options }: createCustomTypeOptions,
  typeDefs: string
) => {
  const { properties, name, comment, type } = options;
  let splatTypeDefs: string | string[] = typeDefs
    .split("\n")
    .map((line: string) => line.trim());
  let scalarType: string;
  const { typeDefInterface } = createInterface(properties, name);
  if (!Object.keys(typeDefInterface).length) return splatTypeDefs;
  const index = splatTypeDefs.indexOf("# generated definitions");
  const interfaceStringified = JSON.stringify(typeDefInterface, null, 2);
  const interfaceString = `\n ${type} ${name}Options ${interfaceStringified}\n#${comment}\n# added at: ${new Date()}`;
  let finishedInterfaceDef = utils.replaceAllInString(interfaceString, '"', "");
  splatTypeDefs.splice(index + 1, 0, finishedInterfaceDef);
  splatTypeDefs = utils.replaceAllInString(
    splatTypeDefs.join("\n"),
    "Number",
    "Int"
  );
  await write("./typeDefs.ts", splatTypeDefs);
  return;
};
export const createNewInterface = async ({
  options,
}: createCustomTypeOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type interface...");

  const typeDefs = await getTypeDefs(); // current typeDef file as string
  if (!typeDefs) return;
  const compiledInterface = toInterface({ options: options });

  try {
    await insertInterface(options.name, compiledInterface);
    const { typeDef } = options;
    if (typeDef) await createTypeDef({ options: options }, typeDefs);

    Logger.http(
      "FROM: EPB-server: Interface created successfully, applying Prettier."
    );

    try {
      await execa("npx prettier --write *.ts");
    } catch ({ message }) {
      Logger.error(`FROM: EPB-server: ${message}`);
    }
    return "OK";
  } catch ({ message }) {
    return message;
  }
};
