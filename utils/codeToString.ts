import fs from "fs";
import Logger from "../logger/logger";
import { promisify } from "util";
import { resolvers } from "../resolvers";
const read = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const access = promisify(fs.access);
const getActionOnly = new RegExp(/\/\/ Action: \w+.*/g);

export const checkIfOK = async (path: string) => {
  try {
    await access(path, fs.constants.R_OK);
    return "OK";
  } catch ({ message }) {
    Logger.error(`Could not locate ${path} file, ${message}`);
  }
};
export const getResolvers = async () => {
  if (!(await checkIfOK("./resolvers.ts"))) return;
  return await read("./resolvers.ts", "utf8");
};
export const getTypeDefs = async () => {
  if (!(await checkIfOK("./typeDefs.ts"))) return;
  return await read("./typeDefs.ts", "utf8");
};
export const getActions = async () => {
  const resolvers = await getResolvers();
  if (!resolvers) return;
  return resolvers.match(getActionOnly)?.map((action: string) => {
    const parsedAction = action.split("//")[1].trim();
    const actionAction = parsedAction.split("Action: ")[1];
    return actionAction.charAt(0).toUpperCase() + actionAction.slice(1);
  });
};
let interval: any;
export const getResolverNames = async () => {
  try {
    const mutations = Object.keys(resolvers.Mutation);
    const queries = Object.keys(resolvers.Query);
    const allTypes = await readDir("./types");
    clearInterval(interval);
    return mutations.concat(queries.concat(allTypes));
  } catch ({ message }) {
    interval = setInterval(() => {
      getResolverNames();
    }, 300);
  }
};
