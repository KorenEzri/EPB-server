import fs from "fs";
import Logger from "../logger/logger";
import { promisify } from "util";
const read = promisify(fs.readFile);
const access = promisify(fs.access);
const getActionOnly = new RegExp(/; \/\/ Action: \w+.*/g);
const getWholeResolver = new RegExp(/await \w+.*/g);

export const getResolvers = async () => {
  try {
    await access("resolvers.ts", fs.constants.R_OK);
  } catch ({ message }) {
    Logger.error(`Could not locate resolvers file, ${message}`);
  }
  Logger.info("Sending resolvers as string..");
  return await read("resolvers.ts", "utf8");
};
export const getTypeDefs = async () => {
  try {
    await access("typeDefs.ts", fs.constants.R_OK);
  } catch ({ message }) {
    Logger.error(`Could not locate resolvers file, ${message}`);
  }
  Logger.info("Sending typeDefs as string..");
  return await read("typeDefs.ts", "utf8");
};
export const getActions = async () => {
  const resolvers = await getResolvers();
  if (!resolvers) return;
  return resolvers
    .split("Query:")[1]
    .match(getActionOnly)
    ?.map((action: string) => {
      const parsedAction = action.split("//")[1].trim();
      const actionAction = parsedAction.split("Action: ")[1];
      return actionAction.charAt(0).toUpperCase() + actionAction.slice(1);
    });
};
