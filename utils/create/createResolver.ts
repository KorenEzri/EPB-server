import { ResolverOptions } from "../../types";
import { getResolvers } from "../codeToString";
import Logger from "../../logger/logger";
import { createNewInterface } from "./";
import { promisify } from "util";
import fs from "fs";
import * as parseVars from "../utils/parse-vars";
import * as utils from "../utils";
const write = promisify(fs.writeFile);

const toResolver = ({ options }: ResolverOptions) => {
  const { name, comment, returnType, properties, description } = options;
  const { resolverInterface, varList, importList } =
    parseVars.parseResolverVarlist(properties);
  let stringifiedVarList: string[] = [];
  if (Array.isArray(varList)) {
    stringifiedVarList = varList.map((variable) => {
      return `${variable.name}:${variable.type}`;
    });
  }
  let resolverString = `
        // Action: ${description}
        ${name}: async (_:any, ${
    resolverInterface ? `{ options }:${name}Options` : stringifiedVarList
  }) => {
          // ${comment}
          // return ${returnType}
      },
        `;
  resolverString = utils.replaceAllInString(resolverString, "\t", "");
  resolverString = utils.replaceAllInString(resolverString, '"', "");
  return { fullResolver: resolverString, importList };
};

export const createNewResolver = async ({ options }: ResolverOptions) => {
  Logger.http("FROM: EPB-server: Creating a new resolver...");
  const { fullResolver, importList } = toResolver({ options: options });
  let allResolversAsString = (await getResolvers()) || ""; // current resolver file as string
  if (!allResolversAsString)
    return "Error in utils/createNew/createResolver.ts: No resolvers found!";
  if (options.properties.length >= 3) {
    let interfaceOptions: any = {};
    Object.assign(interfaceOptions, options);
    await createNewInterface({ options: interfaceOptions });
    allResolversAsString = utils.insertImportStatement(
      allResolversAsString,
      options.name
    );
  }
  if (Array.isArray(importList))
    importList.forEach((toImport: string) => {
      allResolversAsString = utils.insertImportStatement(
        allResolversAsString,
        toImport
      );
    });
  const finishedResolvers = utils.insertToString(
    allResolversAsString,
    fullResolver,
    options.type,
    "//"
  );
  if (!finishedResolvers)
    return "Error in utils/createNew/createResolver.ts - @ insertToString() - returned undefined!";
  await write("./resolvers.ts", finishedResolvers);
  Logger.http(
    "FROM: EPB-server: Action created successfully, applying Prettier for files.."
  );
  await utils.applyPrettier();
  return "Resolver created successfully.";
};
