import { ResolverOptions } from "../../types2";
import { getResolvers } from "../codeToString";
import Logger from "../../logger/logger";
import { promisify } from "util";
import fs from "fs";
import * as utils from "./utils";
const write = promisify(fs.writeFile);

const toResolver = ({ options }: ResolverOptions) => {
  const { name, comment, returnType, properties, description } = options;
  const { resolverInterface, varList } = utils.parseResolverVarlist(properties);
  let resolverString = `
        // Action: ${description}
        ${name}: async (_:any, ${
    resolverInterface ? `{ options }:${name}Options` : varList
  }) => {
          // ${comment}
          // return ${returnType}
      },
        `;
  resolverString = utils.replaceAllInString(resolverString, "\t", "");
  resolverString = utils.replaceAllInString(resolverString, '"', "");
  return resolverString;
};

export const createNewResolver = async ({ options }: ResolverOptions) => {
  Logger.http("FROM: EPB-server: Creating a new resolver...");
  const fullResolver = toResolver({ options: options });
  const allResolversAsString = await getResolvers(); // current resolver file as string
  if (!allResolversAsString)
    return "Error in utils/createNew/createResolver.ts: No resolvers found!";
  const allResolvers = utils.insertToString(
    allResolversAsString,
    fullResolver,
    options.type,
    "//"
  );
  if (!allResolvers)
    return "Error in utils/createNew/createResolver.ts - @ insertToString() - returned undefined!";
  await write("./resolvers.ts", allResolvers);
  Logger.http(
    "FROM: EPB-server: Action created successfully, applying Prettier for files.."
  );
  await utils.applyPrettier();
  return "Resolver created successfully.";
};
