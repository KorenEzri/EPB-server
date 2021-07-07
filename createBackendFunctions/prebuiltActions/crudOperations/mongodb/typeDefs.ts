import * as utils from "../../../utils";
import * as mongoUtils from "./util";
import * as create from "../../../create";
import { promisify } from "util";
import fs from "fs";
import {
  createResolverOptions,
  createCustomTypeOptions,
} from "../../../../types";
import Logger from "../../../../logger/logger";
const read = promisify(fs.readFile);

const getTypedefInterfaceFromModelName = async (model: string) => {
  const filePath = `types/${model}Options.ts`;
  const interfaceFileLineArray = utils.toLineArray(
    await read(filePath, "utf8")
  );
  const typeDefInterface: any = {};
  let startIndex: number = -2,
    endIndex: number = -2;
  interfaceFileLineArray.forEach((line: string) => {
    if (line.includes("export interface") && startIndex === -2) {
      startIndex = interfaceFileLineArray.indexOf(line);
    } else if (line.includes("// added at:") && endIndex === -2) {
      endIndex = interfaceFileLineArray.indexOf(line);
    }
  });
  typeDefInterface.properties = interfaceFileLineArray
    .slice(startIndex + 2, endIndex - 2)
    .map((line: string) => utils.replaceAllInString(line.trim(), ",", ""));
  return typeDefInterface;
};

export const createTypedefFromOpts = async (options: createResolverOptions) => {
  const modelNameOnly = utils.replaceAllInString(options.Model, "Schema", "");
  const typeDefInterface = await getTypedefInterfaceFromModelName(
    modelNameOnly
  );
  const lowerCaseAction = options.action.toLowerCase();
  const mutationQuery = mongoUtils.mutationCRUDS.includes(options.action);
  const returnType = mutationQuery
    ? "String"
    : lowerCaseAction.includes("many") || lowerCaseAction.includes("all")
    ? `[${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType]`
    : `${utils.lowercaseFirstLetter(modelNameOnly)}OptionsType`;
  const type = mutationQuery ? "Mutation" : "Query";
  const createCustomTypeOptions: createCustomTypeOptions = {
    options: {
      properties: mutationQuery ? typeDefInterface.properties : undefined,
      name: modelNameOnly,
      comment: "Custom type created by CRUD generator",
      dbSchema: true,
      typeDef: true,
      returnType,
      type,
      tsInterface: "no",
      actionName: utils.lowercaseFirstLetter(options.action),
    },
  };
  Logger.http("FROM: EPB-server: Creating a new type definition..");
  await create.createNewInterface(createCustomTypeOptions);
  createCustomTypeOptions.options.returnType = "";
  await create.createNewInterface(createCustomTypeOptions);
};
