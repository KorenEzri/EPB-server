import { allCustomTypesWithArrayTypes } from "../../consts";
import Logger from "../../logger/logger";
import fs from "fs";
import execa from "execa";
import { promisify } from "util";
import * as utils from ".";
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
  if (dir.includes(fileName) || dir.includes(`${fileName}.ts`)) {
    return true;
  } else return false;
};
export const addToAllowedTypes = (name: string) => {
  allCustomTypesWithArrayTypes.push(`[${name}Options]`);
  allCustomTypesWithArrayTypes.push(`${name}Options[]`);
  allCustomTypesWithArrayTypes.push(`${name}Options`);
};
export const restartServer = async () => {
  // await write(
  //   'node_modules/@korenezri/easy-peasy-backend/epb/client/build" "nodemon index.ts" "nodemon node_modules/@korenezri/easy-peasy-backend/epb/epb-server/build/restart.json',
  //   `{"restart":"${Math.random()}"}`
  // );
  await write("restart.json", `{"restart":"${Math.random()}"}`);
};
export const getAllSchemaNames = async () => {
  const schemaFolderPath = "db/schemas";
  const isOK = await checkIfOK(schemaFolderPath);
  if (!isOK) {
    Logger.error("FROM: EPB-server: could not locate databse schema folder!");
  }
  const allSchemaNames = await readDir(schemaFolderPath);
  return allSchemaNames.filter((val) => {
    if (
      val !== "index.ts" &&
      val !== "stub.ts" &&
      val != null &&
      !val.includes("SchemaConfig")
    )
      return val;
  });
};
export const insertImportStatement = (resolvers: string, name: string) => {
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
  if (
    importStatement.includes(name) ||
    importStatement.includes(`${name}Options`) ||
    importStatement[0].includes(name) ||
    importStatement[0].includes(`${name}Options`)
  ) {
    return splatResolvers.join("\n");
  }
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

export const insertStringToFileInRangeOfLines = async (
  filePath: string,
  string: string,
  startHandler: string | number,
  endHandler: string | number,
  duplicates?: boolean,
  addToStartIndex?: number
) => {
  addToStartIndex = addToStartIndex ? addToStartIndex : 0;
  const fileAsString = await read(filePath, "utf8");
  const lineArray = await utils
    .toLineArray(fileAsString)
    .map((line: string) => line.trim());
  const startIndex =
    typeof startHandler === "number"
      ? startHandler
      : lineArray.indexOf(startHandler);
  const endIndex =
    typeof endHandler === "number" ? endHandler : lineArray.indexOf(endHandler);
  const linesInRange = lineArray
    .map((line: string, index: number) => {
      if (index >= startIndex + 1 && index <= endIndex - 1) {
        return line.trim();
      }
    })
    .filter((v: string) => v != null);
  if (linesInRange.includes(string) || linesInRange[0].includes(string)) {
    if (!duplicates) return lineArray.join("\n");
  }
  if (linesInRange.length > 1) {
    linesInRange.splice(1, 0, string);
    lineArray.splice(startIndex, endIndex - startIndex, linesInRange.join(""));
  } else {
    const splatOneLineRange = linesInRange[0].split("}");
    splatOneLineRange[0] = `${splatOneLineRange[0]}, ${string} }`;
    lineArray.splice(
      startIndex + 1 + addToStartIndex,
      1,
      splatOneLineRange.join("")
    );
  }
  const finished = utils.fromLineArray(lineArray);
  await write(filePath, finished);
};
