import { createSchemaOptions } from "../../types";
import * as create from "./createSchemaByDB";
import Logger from "../../logger/logger";
import { promisify } from "util";
import fs from "fs";
const read = promisify(fs.readFile);

const currentDatabase = async (path: string) => {
  const config = await read(path);
  console.log(config);
};

export const createDbSchema = async ({ options }: createSchemaOptions) => {
  const res = await currentDatabase("./epb.config.json");
  Logger.http("FROM: EPB-server: creating a DB schema, database: ");

  return;
};
