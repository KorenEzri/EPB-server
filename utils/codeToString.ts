import fs from "fs";
import Logger from "../logger/logger";
import { promisify } from "util";
const read = promisify(fs.readFile);

export const getCodeAsString = async (path: string) => {
  Logger.info("Path received: ", path);
  return await read(path);
};
export const getResolvers = async () => {
  Logger.info("Sending resolvers as string..");
  return await read("resolvers.ts", "utf8");
};
