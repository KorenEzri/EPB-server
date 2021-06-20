import { ResolverOptions } from "../../types";
import * as utils from "./string.util";
import { promisify } from "util";
import fs from "fs";
import { getResolvers } from "../codeToString";
const write = promisify(fs.writeFile);

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
      ${name}: async (_:any, ${varList}) => {
        // Action: ${description}
        // ${parsedComment}
        // return ${returnType}
    },
      `;
};
const insertInterface = (splatResolvers: string[], name: String) => {
  if (!Object.values(varInterface).length) return splatResolvers;
  const index = splatResolvers.indexOf("// generated interfaces");
  const interfaceString = `\ninterface ${name}Options ${JSON.stringify(
    varInterface,
    null,
    2
  )}\n// added at: ${new Date()}`;
  splatResolvers.splice(
    index + 1,
    0,
    utils.replaceAllInString(interfaceString, '"', "")
  );
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
  const revisedResolvers = insertInterface(splatResolvers, options.name).join(
    "\n"
  );
  await write("./resolvers.ts", revisedResolvers);
};
