import { createCustomTypeOptions } from "../../types";
import { checkIfOK, getTypeDefs } from "../codeToString";
import { allCustomTypes } from "../../consts";
import { promisify } from "util";
import Logger from "../../logger/logger";
import * as utils from "./string.util";
import fs from "fs";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

export const insert_Into_Types_Index_TS = async (exportStatement: string) => {
  const typeIndexPath = "./types/index.ts";
  try {
    const isOK = await checkIfOK(typeIndexPath);
    if (!isOK)
      return "Error in insert_Into_Types_Index_TS - checkIfOK() returned 'undefined'";
    const typeIndexFile = await read(typeIndexPath, "utf8");
    try {
      const assorted = typeIndexFile.split("\n");
      if (!assorted.includes(exportStatement)) {
        assorted.push(exportStatement);
        await write(typeIndexPath, assorted.join("\n"));
        return "OK";
      } else {
        return "Export statement already exists, please update the interface's file instead.";
      }
    } catch ({ message }) {
      Logger.error(message);
      return message;
    }
  } catch ({ message }) {
    Logger.error(message);
    return message;
  }
};
const toInterface = ({ options }: createCustomTypeOptions) => {
  let interfaceString: any = {};
  let varList;
  let importList: string[] = [];
  const { properties, name } = options;
  varList = utils.compileToVarList(properties);
  interfaceString.options = {};
  varList.forEach((variable) => {
    if (allCustomTypes.includes(variable.type.trim())) {
      let varType = variable.type;
      if (varType.split("Type").length > 1) {
        varType = varType.split("Type")[0];
      }
      if (varType.split("Input").length > 1) {
        varType = varType.split("Input")[0];
      }
      importList.push(varType);
      interfaceString.options[variable.var] = varType.trim();
    } else {
      const lowerCaseVar = utils.fixTypes(variable);
      interfaceString.options[variable.var] = lowerCaseVar;
    }
  });
  const importStatements = importList.map((typeImport: string) => {
    if (typeImport.split("Type").length > 1) {
      typeImport = typeImport.split("Type")[0];
    }
    if (typeImport.split("Input").length > 1) {
      typeImport = typeImport.split("Input")[0];
    }
    return `import {${typeImport}} from './';`;
  });
  varList = `{ options }:${name}Options`;
  interfaceString = `// imports section \n\n${importStatements.join(
    "\n"
  )}//\n\n// imports section end\n\nexport interface ${name}Options ${JSON.stringify(
    interfaceString,
    null,
    2
  )}\n// added at: ${new Date()} \n\n// exports section\n\n// exports section end`;
  return interfaceString;
};
const insertInterface = async (name: String, interfaceString: any) => {
  if (!Object.values(interfaceString).length)
    return "Error: couldn't compile an interface, aborting..";
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
  const { typeDefInterface } = createInterface(properties, name);
  if (!Object.keys(typeDefInterface).length) return splatTypeDefs;
  const index = splatTypeDefs.indexOf("# generated definitions");
  const interfaceStringified = JSON.stringify(typeDefInterface, null, 2);
  const interfaceString = `\n ${type} ${name}Options${utils.capitalizeFirstLetter(
    type || "Type"
  )} ${interfaceStringified}\n#${comment}\n# added at: ${new Date()}`;
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
  if (!typeDefs) return "No typedefs found, aborting!";
  const compiledInterface = toInterface({ options: options });
  try {
    await insertInterface(options.name, compiledInterface);
    const { typeDef } = options;
    if (typeDef) await createTypeDef({ options: options }, typeDefs);
    Logger.http(
      "FROM: EPB-server: Interface created successfully, applying Prettier."
    );
    await utils.applyPrettier();
    return "OK";
  } catch ({ message }) {
    return message;
  }
};
