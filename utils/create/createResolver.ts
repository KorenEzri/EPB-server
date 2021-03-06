import { ResolverOptions } from "../../types";
import { getResolvers } from "../codeToString";
import Logger from "../../logger/logger";
import { createNewInterface } from "./";
import { promisify } from "util";
import fs from "fs";
import * as utils from "../utils";
const write = promisify(fs.writeFile);

const insertImportStatement = (resolvers: string, name: string) => {
  const splatResolvers: string[] = utils
    .toLineArray(resolvers)
    .map((line: string) => line.trim());
  const startIndex = splatResolvers.indexOf("// option types");
  const endIndex = splatResolvers.indexOf("// option types end");
  let importName: string = "";
  const importStatement = splatResolvers
    .map((line: string, index: number) => {
      if (index >= startIndex + 1 && index <= endIndex - 1) {
        return line;
      }
    })
    .filter((v) => {
      return v != null;
    });
  if (!importStatement[0]) return "err";
  if (importStatement.length > 1) {
    let nameOptionsStringIncluded = name.includes("Options");
    nameOptionsStringIncluded
      ? (importName = ` ${name},`)
      : (importName = ` ${name}Options,`);
    importStatement.splice(1, 0, importName);
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
  return splatResolvers.join("\n");
};
const toResolver = ({ options }: ResolverOptions) => {
  const { name, comment, returnType, properties, description } = options;
  const { resolverInterface, varList, importList } =
    utils.parseResolverVarlist(properties);
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
    allResolversAsString = insertImportStatement(
      allResolversAsString,
      options.name
    );
  }
  importList.forEach((toImport: string) => {
    allResolversAsString = insertImportStatement(
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
