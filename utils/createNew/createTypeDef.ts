import { ResolverOptions } from "../../types";
import * as utils from "./string.util";
import { promisify } from "util";
import fs from "fs";
import { getTypeDefs, getResolverNames } from "../codeToString";
const write = promisify(fs.writeFile);

let typeDefInterface: any = {};
const toTypeDef = ({ options }: ResolverOptions) => {
  const { name, returnType, vars } = options;
  let varList;
  varList = utils.compileToVarList(vars);
  if (vars.length < 3) {
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
  vars.length
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
  const finishedInterfaceDef = utils.replaceAllInString(
    interfaceString,
    '"',
    ""
  );
  splatTypeDefs.splice(index + 1, 0, finishedInterfaceDef);
  return splatTypeDefs;
};
export const createNewTypeDef = async ({ options }: ResolverOptions) => {
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
  const revisedTypeDefs = insertTypeDef(
    splatTypeDefs,
    options.name,
    options.type
  ).join("\n");
  // const formatted = prettier.format(
  //   utils.replaceAllInString(revisedTypeDefs, "Number", "Int"),
  //   {
  //     semi: false,
  //     parser: "babel",
  //   }
  // );
  await write(
    "./typeDefs.ts",
    utils.replaceAllInString(revisedTypeDefs, "Number", "Int")
  );
};
export const createNewTypeOnly = async (options: any) => {};
