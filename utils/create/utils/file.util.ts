import { createCustomTypeOptions } from "../../../types";
import { allCustomTypes } from "../../../consts";
import Logger from "../../../logger/logger";
import fs from "fs";
import execa from "execa";
import { promisify } from "util";
import * as utils from "./";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const access = promisify(fs.access);

export const addExportStatement = async (
  filePath: string,
  exportStatement: string
) => {
  const path = `${filePath}/index.ts`;
  try {
    const isOK = await checkIfOK(path);
    if (!isOK)
      return "Error in create/file.util.ts/addExportStatement() - checkIfOK() returned 'undefined'";
    const readFile = await read(path, "utf8");
    const lineArray = utils.toLineArray(readFile);
    if (!lineArray.includes(exportStatement)) {
      lineArray.push(exportStatement);
      await write(path, utils.fromLineArray(lineArray));
      return "OK";
    } else {
      return "Export statement already exists, please update the interface's file instead.";
    }
  } catch ({ message }) {
    Logger.error(message);
    return message;
  }
};
export const applyPrettier = async (path?: string) => {
  try {
    path
      ? await execa(`npx prettier --write ${path}`)
      : await execa("npx prettier --write *.ts");
  } catch ({ message }) {
    Logger.error(`FROM: EPB-server: ${message}`);
  }
};
export const checkIfOK = async (path: string) => {
  try {
    await access(path, fs.constants.R_OK);
    return "OK";
  } catch ({ message }) {
    Logger.error(`Could not locate ${path} file, ${message}`);
  }
};
export const checkIfFileAlreadyExists = async (
  dirPath: string,
  fileName: string
) => {
  const dir = await readDir(dirPath);
  if (dir.includes(fileName || `${fileName}.ts`)) {
    return true;
  } else return false;
};
