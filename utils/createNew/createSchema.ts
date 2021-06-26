import { createSchemaOptions } from "../../types";
import { checkIfOK } from "../../utils/codeToString";
import { promisify } from "util";
import Logger from "../../logger/logger";
import fs from "fs";
import * as create from "./createSchemaByDB";
const read = promisify(fs.readFile);

const currentDatabase = async (path: string) => {
  const isOK = await checkIfOK(path);
  if (!isOK) return;
  const config = JSON.parse(await read(path, "utf8"));
  return config.database;
};

export const createDbSchema = async ({ options }: createSchemaOptions) => {
  const res = await currentDatabase("./epb.config.json");
  Logger.http(`FROM: EPB-server: creating a DB schema, database: ${res}`);
  switch (res) {
    case "mongodb":
      try {
        const res = await create.createMongoDBSchema({
          options: options,
        });
        return res;
      } catch ({ message }) {
        Logger.error(
          `FROM: EPB-server: Error with creating a DB schema: ${message}`
        );
        return message;
      }

      break;

    default:
      break;
  }
  return;
};
