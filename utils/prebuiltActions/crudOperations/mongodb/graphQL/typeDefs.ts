import * as utils from "../../../../utils";
import * as mongoUtils from "../util";
import { createNewTypeDef } from "../../../../create";
import { promisify } from "util";
import fs from "fs";
const read = promisify(fs.readFile);

const createTypedefForCRUDS = async (
  interfaceFilePath: string,
  name: string,
  type: string,
  returnType?: string
) => {
  const interfaceFileLineArray = utils.toLineArray(
    await read(interfaceFilePath, "utf8")
  );
  const options: any = {};
  let startIndex: number = -2,
    endIndex: number = -2;
  interfaceFileLineArray.forEach((line: string) => {
    if (line.includes("export interface") && startIndex === -2) {
      startIndex = interfaceFileLineArray.indexOf(line);
    } else if (line.includes("// added at:") && endIndex === -2) {
      endIndex = interfaceFileLineArray.indexOf(line);
    }
  });
  options.properties = interfaceFileLineArray
    .slice(startIndex + 2, endIndex - 2)
    .map((line: string) => utils.replaceAllInString(line.trim(), ",", ""));
  options.name = name;
  options.typeDef = true;
  options.dbSchema = false;
  options.type = type;
  options.returnType = returnType;
  await createNewTypeDef({ options: options }, true);
};
export const generateTypedefForOne = async (
  Model: string,
  action: string,
  typedefType: string,
  returnType?: string
) => {
  const modelNameOnly = utils.replaceAllInString(
    utils.replaceAllInString(Model, "Model", ""),
    "Schema",
    ""
  );
  const actionNameForTypeDef = mongoUtils.generateResolverName(Model, action);
  const modelPath = `types/${modelNameOnly}Options.ts`;
  await createTypedefForCRUDS(
    modelPath,
    actionNameForTypeDef,
    typedefType,
    returnType || "string"
  );
};
export const generateTypedefForManyCRUD = async (
  Model: string,
  action: string,
  typedefType: string,
  returnType?: string
) => {
  const modelNameOnly = utils.replaceAllInString(
    utils.replaceAllInString(Model, "Model", ""),
    "Schema",
    ""
  );
  const actionNameForTypeDef = mongoUtils.generateResolverName(Model, action);
  const modelPath = `types/${modelNameOnly}Options.ts`;
  await createTypedefForCRUDS(
    modelPath,
    actionNameForTypeDef,
    typedefType,
    returnType || "string"
  );
};
