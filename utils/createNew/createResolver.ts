import { ResolverOptions } from "../../types";
import * as utils from "./string.util";
import { promisify } from "util";
import fs from "fs";
import { getResolvers } from "../codeToString";
import { insert_Into_Types_Index_TS } from "./";
import Logger from "../../logger/logger";
const write = promisify(fs.writeFile);
let varInterface: any = {};

const toResolver = ({ options }: ResolverOptions) => {
  const { name, comment, returnType, properties, description } = options;
  let parsedComment;
  let varList;
  varList = utils.compileToVarList(properties);
  comment.split("//").length
    ? (parsedComment = comment)
    : (parsedComment = `// ${comment}`);
  if (properties.length < 3) {
    varList = varList.map((variable) => {
      return `${variable.var}:${variable.type}`;
    });
  } else {
    varInterface.options = {};
    varList.forEach((variable) => {
      const lowerCaseVar = utils.fixTypes(variable);
      varInterface.options[variable.var] = lowerCaseVar;
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
const insertInterface = async (splatResolvers: string[], name: String) => {
  if (!Object.values(varInterface).length) return splatResolvers;
  const startIndex = splatResolvers.indexOf("// option types");
  const endIndex = splatResolvers.indexOf("// option types end");
  const importStatement = splatResolvers
    .map((line: string, index: number) => {
      if (index >= startIndex + 1 && index <= endIndex - 1) {
        return line;
      }
    })
    .filter((v) => {
      return v != null;
    });
  if (!importStatement[0]) return;
  if (importStatement.length > 1) {
    importStatement.splice(1, 0, ` ${name}Options,`);
    splatResolvers.splice(
      startIndex + 1,
      endIndex - startIndex - 1,
      importStatement.join("")
    );
  } else {
    const splat = importStatement[0].split(",");
    splat[0] = `${splat[0]}, ${name}Options`;
    splatResolvers.splice(startIndex + 1, 1, splat.join(","));
  }
  let interfaceString = `export interface ${name}Options ${JSON.stringify(
    varInterface,
    null,
    2
  )}\n// added at: ${new Date()}`;
  interfaceString = utils.replaceAllInString(interfaceString, '"', "");
  interfaceString = utils.replaceAllInString(interfaceString, "||", "|");
  await write(`./types/${name}Options.ts`, interfaceString);
  await insert_Into_Types_Index_TS(`export * from "./${name}Options"`);
  return splatResolvers;
};
export const createNewResolver = async ({ options }: ResolverOptions) => {
  Logger.http("FROM: EPB-server: Creating a new resolver...");
  // compile a resolver string from options
  const fullResolver = utils.replaceAllInString(
    toResolver({ options: options }),
    "\t",
    ""
  );
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
  const insertedInterface = await insertInterface(splatResolvers, options.name);
  if (!insertedInterface) return "ERROR";
  const revisedResolvers = insertedInterface.join("\n");
  await write("./resolvers.ts", revisedResolvers);
  Logger.http(
    "FROM: EPB-server: Action created successfully, applying Prettier for files.."
  );
  await utils.applyPrettier();
  return;
};
