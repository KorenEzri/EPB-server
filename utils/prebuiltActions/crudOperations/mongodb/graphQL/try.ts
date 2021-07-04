import * as utils from "../../../../utils";
import * as mongoUtils from "../util";
import { promisify } from "util";
import fs from "fs";
import {
  typeDefTitles,
  typeDefVariableLists,
  typeDefQueryMutationDefinitions,
} from "./util";
import {
  createTypeDefOptions,
  typeDefTitleOptions,
  typeDefVariableListOptions,
  typeDefQueryMutationDefinitionsOptions,
} from "../../../../../types";

const read = promisify(fs.readFile);

const buildTypeDef = (
  action: string,
  options: { title: typeDefTitleOptions; varList: typeDefVariableListOptions }
) => {
  const { title, varList } = options;
  const typeDefTitle = `${title.type} ${title.name} {`;
  switch (action.split(" ").join("")) {
    case "CreateOne":
      const createOneBody = typeDefVariableLists.createOne(varList);
      return typeDefTitle + createOneBody;
    case "CreateMany":
      const createManyTitle = typeDefTitles.createMany(title);
      const createManyBody = typeDefVariableLists.createMany(varList);
      return createManyTitle + createManyBody;
    case "ReadOne":
      const readOneTitle = typeDefTitles.readOne(title);
      const readOneBody = typeDefVariableLists.readOne(varList);
      return readOneTitle + readOneBody;
    case "ReadMany":
      const readManyTitle = typeDefTitles.readMany(title);
      const readManyBody = typeDefVariableLists.readMany(varList);
      return readManyTitle + readManyBody;
    case "ReadAll":
      const readAllTitle = typeDefTitles.readAll(title);
      const readAllBody = typeDefVariableLists.readAll(varList);
      return readAllTitle + readAllBody;
    case "UpdateOne":
      const updateOneTitle = typeDefTitles.updateOne(title);
      const updateOneBody = typeDefVariableLists.updateOne(varList);
      return updateOneTitle + updateOneBody;
    case "UpdateMany":
      return "NOT SUPPORTED";
    case "DeleteOne":
      const deleteOneTitle = typeDefTitles.deleteOne(title);
      const deleteOneBody = typeDefVariableLists.deleteOne(varList);
      return deleteOneTitle + deleteOneBody;
    case "DeleteMany":
      const deleteManyTitle = typeDefTitles.deleteMany(title);
      const deleteManyBody = typeDefVariableLists.deleteMany(varList);
      return deleteManyTitle + deleteManyBody;
    default:
      return "ERROR";
  }
};
const getTypeDefQMDefinition = (
  action: string,
  options: typeDefQueryMutationDefinitionsOptions
) => {
  switch (action.split(" ").join("")) {
    case "CreateOne":
      return typeDefQueryMutationDefinitions.createOne(options);
    case "CreateMany":
      return typeDefQueryMutationDefinitions.createMany(options);
    case "ReadOne":
      return typeDefQueryMutationDefinitions.readOne(options);
    case "ReadMany":
      return typeDefQueryMutationDefinitions.readMany(options);
    case "ReadAll":
      return typeDefQueryMutationDefinitions.readAll(options);
    case "UpdateOne":
      return typeDefQueryMutationDefinitions.updateOne(options);
    case "UpdateMany":
      return "NOT SUPPORTED";
    case "DeleteOne":
      return typeDefQueryMutationDefinitions.deleteOne(options);
    case "DeleteMany":
      return typeDefQueryMutationDefinitions.deleteMany(options);
    default:
      return "ERR";
  }
};
const parseTypeDefOptions = async (options: createTypeDefOptions) => {
  const { Model, action } = options;
  const lowercasedModelSchemaName = utils.lowercaseFirstLetter(Model);
  const type = mongoUtils.mutationCRUDS.includes(action.split(" ").join(""))
    ? "input"
    : "type";
  const modelFunctionVarName = utils.replaceAllInString(
    lowercasedModelSchemaName,
    "Schema",
    ""
  );
  const interfaceFilePath = `types/${modelFunctionVarName}Options.ts`;
  const interfaceFileLineArray = utils.toLineArray(
    await read(interfaceFilePath, "utf8")
  );
  let startIndex: number = -2,
    endIndex: number = -2;
  interfaceFileLineArray.forEach((line: string) => {
    if (line.includes("export interface") && startIndex === -2) {
      startIndex = interfaceFileLineArray.indexOf(line);
    } else if (line.includes("// added at:") && endIndex === -2) {
      endIndex = interfaceFileLineArray.indexOf(line);
    }
  });
  const interfaceProps = interfaceFileLineArray
    .slice(startIndex + 2, endIndex - 2)
    .map((line: string) => utils.replaceAllInString(line.trim(), ",", ""))
    .join("\n");
  return { lowercasedModelSchemaName, type, varListString: interfaceProps };
};
export const createTypedefFromOpts = async (options: createTypeDefOptions) => {
  const parts = await parseTypeDefOptions(options);
  const { action } = options;
  const titleOptions: typeDefTitleOptions = {
    type: parts.type,
    name: parts.lowercasedModelSchemaName,
  };
  const varListOptions: typeDefVariableListOptions = {
    varListString: parts.varListString,
  };
  const queryMutationOptions: typeDefQueryMutationDefinitionsOptions = {};
  const typeDef = buildTypeDef(action, {
    title: titleOptions,
    varList: varListOptions,
  });
  const resolverDefinition = getTypeDefQMDefinition(queryMutationOptions);
  console.log(typeDef, resolverDefinition);
  //   await mongoUtils.writeTypedefIntoFile(typeDef, resolverDefinition);
};
