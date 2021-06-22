import { createSchemaOptions } from "../../../types";
import * as utils from "../string.util";
import { promisify } from "util";
import fs from "fs";
import { insert_Into_Types_Index_TS } from "../";
import Logger from "../../../logger/logger";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

const toMongoSchema = ({ options }: createSchemaOptions) => {};
const updateInterfaceFile = async () => {};

export const createMongoDBSchema = ({ options }: createSchemaOptions) => {};
