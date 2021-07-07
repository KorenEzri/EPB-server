import * as mongoUtils from "./util";
import * as utils from "../../../utils";
import { resolverTitles, resolverTryCatchBlocks, resolverBodies } from "./util";
import {
  createResolverOptions,
  resolverTitleOptions,
  resolverBodyOptions,
  resolverTryCatchBlockOptions,
} from "../../../../types";

const buildResolvers = (
  action: string,
  options: { title: resolverTitleOptions; body: resolverBodyOptions }
) => {
  const { title, body } = options;
  switch (action.split(" ").join("")) {
    case "CreateOne":
      const createOneTitle = resolverTitles.createOne(title);
      const createOneBody = resolverBodies.createOne(body);
      return createOneTitle + createOneBody;
    case "CreateMany":
      const createManyTitle = resolverTitles.createMany(title);
      const createManyBody = resolverBodies.createMany(body);
      return createManyTitle + createManyBody;
    case "ReadOne":
      const readOneTitle = resolverTitles.readOne(title);
      const readOneBody = resolverBodies.readOne(body);
      return readOneTitle + readOneBody;
    case "ReadMany":
      const readManyTitle = resolverTitles.readMany(title);
      const readManyBody = resolverBodies.readMany(body);
      return readManyTitle + readManyBody;
    case "ReadAll":
      const readAllTitle = resolverTitles.readAll(title);
      const readAllBody = resolverBodies.readAll(body);
      return readAllTitle + readAllBody;
    case "UpdateOne":
      const updateOneTitle = resolverTitles.updateOne(title);
      const updateOneBody = resolverBodies.updateOne(body);
      return updateOneTitle + updateOneBody;
    case "UpdateMany":
      return "";
    case "DeleteOne":
      const deleteOneTitle = resolverTitles.deleteOne(title);
      const deleteOneBody = resolverBodies.deleteOne(body);
      return deleteOneTitle + deleteOneBody;
    case "DeleteMany":
      const deleteManyTitle = resolverTitles.deleteMany(title);
      const deleteManyBody = resolverBodies.deleteMany(body);
      return deleteManyTitle + deleteManyBody;
    default:
      return "ERROR";
  }
};
const parseResolverInfo = (options: createResolverOptions) => {
  const { Model, action, identifier } = options;
  const capitalizedModelSchemaName = utils.capitalizeFirstLetter(Model);
  const lowercasedModelSchemaame = utils.lowercaseFirstLetter(Model);
  const modelFunctionVarName = utils.replaceAllInString(
    lowercasedModelSchemaame,
    "Schema",
    ""
  );
  const mongoDBModelObjectName = utils.replaceAllInString(
    capitalizedModelSchemaName,
    "Schema",
    "Model"
  );
  const modelInstaceName = `${modelFunctionVarName}Instance`;
  const modelInterfaceName = `${modelFunctionVarName}Options`;
  const resolverName = mongoUtils.generateResolverName(Model, action);
  const mongooseMethod = mongoUtils.getMongooseMethod(
    action.split(" ").join(""),
    identifier,
    modelFunctionVarName
  );
  return {
    resolverName,
    modelInterfaceName,
    modelInstaceName,
    modelFunctionVarName,
    mongoDBModelObjectName,
    mongooseMethod,
  };
};
const getTryCatchBlock = (
  action: string,
  options: resolverTryCatchBlockOptions
) => {
  switch (action.split(" ").join("")) {
    case "CreateOne":
      return resolverTryCatchBlocks.createOne(options);
    case "CreateMany":
      return resolverTryCatchBlocks.createMany(options);
    case "ReadOne":
      return resolverTryCatchBlocks.readOne(options);
    case "ReadMany":
      return resolverTryCatchBlocks.readMany(options);
    case "ReadAll":
      return resolverTryCatchBlocks.readAll(options);
    case "UpdateOne":
      return resolverTryCatchBlocks.updateOne(options);
    case "UpdateMany":
      return "NOT SUPPORTED";
    case "DeleteOne":
      return resolverTryCatchBlocks.deleteOne(options);
    case "DeleteMany":
      return resolverTryCatchBlocks.deleteMany(options);
    default:
      return "ERR";
  }
};
export const createResolverFromOpts = async (
  options: createResolverOptions
) => {
  const parts = parseResolverInfo(options);
  const { action, identifier, resolverType } = options;
  const titleOptions: resolverTitleOptions = {
    resolverName: parts.resolverName,
    modelFunctionVarName: parts.modelFunctionVarName,
    modelInterfaceName: parts.modelInterfaceName,
    identifier,
  };
  const tryCatchBlockOptions: resolverTryCatchBlockOptions = {
    modelInstaceName: parts.modelInstaceName,
    mongoDBModelObjectName: parts.mongoDBModelObjectName,
    modelFunctionVarName: parts.modelFunctionVarName,
    mongooseMethod: parts.mongooseMethod,
    identifier,
  };
  const resolverTryCatchBlock = getTryCatchBlock(action, tryCatchBlockOptions);
  const bodyOptions: resolverBodyOptions = {
    modelInstaceName: parts.modelInstaceName,
    mongoDBModelObjectName: parts.mongoDBModelObjectName,
    modelFunctionVarName: parts.modelFunctionVarName,
    resolverTryCatchBlock,
    mongooseMethod: parts.mongooseMethod,
    identifier,
  };
  const resolver = buildResolvers(action, {
    title: titleOptions,
    body: bodyOptions,
  });
  await mongoUtils.writeResolverIntoFile(`${resolver}},`, resolverType);
};
