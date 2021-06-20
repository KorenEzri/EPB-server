import { ResolverOptions } from "../../types";
import * as utils from "./string.util";
import { promisify } from "util";
import fs from "fs";
import { getResolvers, checkIfOK } from "../codeToString";
import prettier from "prettier";
import Logger from "../../logger/logger";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

let varInterface: any = {};

const toResolver = ({ options }: ResolverOptions) => {
  const { name, comment, returnType, vars, description } = options;
  let parsedComment;
  let varList;
  varList = utils.compileToVarList(vars);
  comment.split("//").length
    ? (parsedComment = comment)
    : (parsedComment = `// ${comment}`);
  if (vars.length < 3) {
    varList = varList.map((variable) => {
      return `${variable.var}:${variable.type}`;
    });
  } else {
    varInterface.options = {};
    varList.forEach((variable) => {
      varInterface.options[variable.var] = variable.type.trim().toLowerCase();
    });
    varList = `{ options }:${name}Options`;
  }
  return `
      // Action: ${description}
      ${name}: async (_:any, ${varList}) => {
        // ${parsedComment}
        // return ${returnType}
    },
      `;
};
const insert_Into_Types_Index_TS = async (exportStatement: string) => {
  const typeIndexPath = "./types/index.ts";
  try {
    const isOK = await checkIfOK(typeIndexPath);
    if (!isOK) return "ERROR";
    const typeIndexFile = await read(typeIndexPath, "utf8");
    try {
      const assorted = typeIndexFile.split("\n");
      assorted.push(exportStatement);
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
const insertInterface = async (splatResolvers: string[], name: String) => {
  if (!Object.values(varInterface).length) return splatResolvers;
  const index = splatResolvers.indexOf("// option types");
  const importStateMent = `${splatResolvers[index + 1]}`.split(",");
  importStateMent.splice(1, 0, ` ${name}Options`);
  splatResolvers.splice(index + 1, 1, importStateMent.join(","));
  const interfaceString = `export interface ${name}Options ${JSON.stringify(
    varInterface,
    null,
    2
  )}\n// added at: ${new Date()}`;
  await write(
    `./types/${name}Options.ts`,
    utils.replaceAllInString(interfaceString, '"', "")
  );
  await insert_Into_Types_Index_TS(`export * from "./${name}Options"`);
  return splatResolvers;
};
export const createNewResolver = async ({ options }: ResolverOptions) => {
  // compile a resolver string from options
  const fullResolver = toResolver({ options: options });
  const resolvers = await getResolvers(); // current resolver file as string
  if (!resolvers) return "ERROR";
  const splatResolvers = resolvers
    .split("\n")
    .map((line: string) => line.trim());
  let indexToPush; // The index (line number) in which the next resolver is meant to enter.
  options.type.toLowerCase() === "mutation" // mutation or query? different line number
    ? (indexToPush = splatResolvers.indexOf("// mutation-end"))
    : (indexToPush = splatResolvers.indexOf("// query-end"));
  // push into line indexToPush the compiled resolver.
  splatResolvers.splice(indexToPush, 0, fullResolver);
  // insert interface into resolvers if needed.
  const revisedResolvers = await insertInterface(splatResolvers, options.name);
  const formatted = prettier.format(revisedResolvers.join("\n"), {
    semi: false,
    parser: "babel",
  });
  await write("./resolvers.ts", formatted);
};
