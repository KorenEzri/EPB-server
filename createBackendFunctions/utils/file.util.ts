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
  //   'node_modules/@korenezri/easy-peasy-backend/epb/client/build" "nodemon index.ts" "nodemon node_modules/@korenezri/easy-peasy-backend/epb/epb-server/build/restart.py',
  //   `{"restart":"${Math.random()}"}`
  // );
  await write("restart.py", `{"restart":"${Math.random()}"}`);
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
      return val.split(".ts").join("");
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
  addToStartIndex?: number,
  addString?: string
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
  if (linesInRange?.includes(string) || linesInRange[0]?.includes(string)) {
    if (!duplicates) return lineArray.join("\n");
  }
  if (linesInRange.length > 1) {
    linesInRange.splice(1, 0, string);
    lineArray.splice(
      startIndex,
      endIndex - startIndex,
      addString + "\n" + linesInRange.join("")
    );
  } else {
    const splatOneLineRange = linesInRange[0].split("}");
    if (!addString) addString = "";
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

export const checkIfLinesAlreadyExist = async (
  lines: string,
  filePath: string | undefined,
  fileAsString: string | undefined
) => {
  if (!filePath && !fileAsString)
    return { error: true, message: "No file or filepath provided." };
  if (filePath && !fileAsString) {
    fileAsString = await read(filePath, "utf8");
  }
  if (!fileAsString) return { error: true, message: "Could not read file." };
  fileAsString = fileAsString
    .split("\n")
    .map((line: string) =>
      utils.replaceAllInString(
        line.trim(),
        [",", " ", ";", "\n", "\r", "\t"],
        ["", "", "", "", "", ""]
      )
    )
    .filter((line: string) => !(line.includes("#") || line.includes("//")))
    .join("\n");
  lines = lines
    .split("\n")
    .map((line: string) =>
      utils.replaceAllInString(
        line.trim(),
        [",", " ", ";", "\n", "\r", "\t"],
        ["", "", "", "", "", ""]
      )
    )
    .filter((line: string) => !(line.includes("#") || line.includes("//")))
    .join("\n");
  if (fileAsString.includes(lines))
    return { error: true, message: "Duplicates found" };
  return { error: false };
};
export const checkForDuplicateLines = async (
  filePath: string | undefined,
  fileAsString: string | undefined
) => {
  const findDuplicates = (arr: string[]) =>
    arr.filter((item, index) => arr.indexOf(item) != index);
  if (!filePath && !fileAsString)
    return { error: true, message: "No file or filepath provided." };
  if (filePath && !fileAsString) {
    fileAsString = await read(filePath, "utf8");
  }
  if (!fileAsString) return { error: true, message: "Could not read file." };
  const fileLineArray = utils
    .toLineArray(fileAsString)
    .map((line: string) => line.trim());
  const duplicates = findDuplicates(fileLineArray);
  if (duplicates.length > 0) {
    return {
      error: true,
      message: `Duplicate lines detected in file ${filePath}.`,
      duplicates,
    };
  } else return { error: false };
};

export const readFromSchemaConfigFile = async (schemaName: string) => {
  !schemaName.includes("Schema")
    ? (schemaName = `${schemaName}Schema`)
    : schemaName;
  const filePath = `db/schemas/${schemaName.split(".ts").join("")}Config.json`;
  const jsonFileAsJSON = JSON.parse(await read(filePath, "utf8"));
  return jsonFileAsJSON.availableCRUDActions;
};
export const readFromConfigFile = async (contentHeader: string) => {
  const filePath = "epb.config.json";
  const jsonFileAsJSON = JSON.parse(await read(filePath, "utf8"));
  const configFileContent = jsonFileAsJSON[contentHeader];
  return configFileContent;
};
export const alterConfigFile = async (
  action: "add" | "remove",
  contentHeader: string,
  content: string,
  type?: "array" | "string"
) => {
  if (!type) type = "array";
  const addToContent = (
    content: string | string[],
    toAdd: string,
    type: string
  ) => {
    if (!content) return type === "array" ? [toAdd] : toAdd;
    if (Array.isArray(content)) {
      if (!content.includes(toAdd)) content.push(toAdd);
      return content;
    } else return content.includes(toAdd) ? content : content + toAdd;
  };
  const removeFromContent = (content: string | string[], toRemove: string) => {
    if (!content) return;
    if (Array.isArray(content)) {
      const index = content?.indexOf(toRemove);
      return content?.splice(index, 1);
    } else return content?.split(`${toRemove}`).join("");
  };
  const filePath = "epb.config.json";
  const jsonFileAsJSON = JSON.parse(await read(filePath, "utf8"));
  const configFileContent = jsonFileAsJSON[contentHeader];
  action === "add"
    ? (jsonFileAsJSON[contentHeader] = addToContent(
        configFileContent,
        content,
        type
      ))
    : removeFromContent(configFileContent, content);

  await write(filePath, JSON.stringify(jsonFileAsJSON));
};
export const checkIfConfigItemExists = async (
  contentHeader: string,
  item: string
) => {
  const filePath = "epb.config.json";
  const jsonFileAsJSON = JSON.parse(await read(filePath, "utf8"));
  const configFileContent = jsonFileAsJSON[contentHeader];
  return configFileContent?.includes(item);
};

export const getAllAllowedTypes = async () => {
  const filePath = "epb.config.json";
  const jsonFileAsJSON = JSON.parse(await read(filePath, "utf8"));
  const content = jsonFileAsJSON.typeDefInterfaces;
  content.forEach((type: string) => {
    if (!type.includes("[")) {
      content.push(`[${type}]`);
    }
  });
  return content;
};

export const getAllSchemaProps = async (schemaName: string) => {
  const filePath = `db/schemas/${schemaName}`;
  const schemaAsString = await read(filePath, "utf8");
  const schemaNameOnly = schemaName.split(".ts").join("");
  const schemaFileLineArray: string[] = utils.toLineArray(schemaAsString);
  const startIndex =
    schemaFileLineArray.indexOf(
      `const ${schemaNameOnly}: Schema = new mongoose.Schema({`
    ) + 1;
  const endIndex =
    schemaFileLineArray.indexOf(`${schemaNameOnly}.plugin(uniqueValidator);`) -
    1;
  const allProperties = schemaFileLineArray.splice(
    startIndex,
    endIndex - startIndex
  );
  return allProperties.map((property: string) =>
    utils.replaceAllInString(property.trim(), ",", "")
  );
};
