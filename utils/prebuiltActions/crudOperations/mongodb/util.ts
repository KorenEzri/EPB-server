import fs from "fs";
import { promisify } from "util";
import * as utils from "../../../utils";
const write = promisify(fs.writeFile);
import { getResolvers } from "../../../codeToString";

export const generateResolverName = (Model: string, action: string) => {
  Model = Model.split("Model").join("");
  Model = Model.split("Schema").join("");
  const actionSplit = action.split(" ");
  actionSplit;
  return `${utils.lowercaseFirstLetter(
    actionSplit[0]
  )}${utils.capitalizeFirstLetter(Model)}`;
};
export const writeResolverIntoFile = async (resolver: string, type: string) => {
  let allResolversAsString = (await getResolvers()) || ""; // current resolver file as string
  if (!allResolversAsString)
    return "Error in utils/createNew/createResolver.ts: No resolvers found!";
  const checkForDuplicates = await utils.checkIfLinesAlreadyExist(
    resolver,
    undefined,
    allResolversAsString
  );
  if (checkForDuplicates.error) {
    return "Error: duplicate resolvers detected, aborting resolver creation";
  }
  const finishedResolvers = utils.insertToString(
    allResolversAsString,
    resolver,
    type,
    "//"
  );
  await write("./resolvers.ts", finishedResolvers);
};
export const mutationCRUDS = [
  "CreateOne",
  "CreateMany",
  "UpdateOne",
  "UpdateMany",
  "DeleteOne",
  "DeleteMany",
];
export const getMongooseMethod = (
  action: string,
  identifier: { name: string; type: string },
  resolverVariable?: string
) => {
  switch (action) {
    case "CreateOne":
      return "save()";
    case "CreateMany":
      return `insertMany(${resolverVariable})`;
    case "ReadOne":
      return `findOne({${identifier.name}:${identifier.type}})`;
    case "ReadMany":
      return `find({${identifier.name}:${identifier.type}})`;
    case "ReadAll":
      return "find()";
    case "UpdateOne":
      return `findOneAndUpdate({${identifier.name}:${identifier.type}}, {${resolverVariable}})`;
    case "UpdateMany":
      return;
    case "DeleteOne":
      return `deleteOne({${identifier.name}:${identifier.type}})`;
    case "DeleteMany":
      return;
    default:
      break;
  }
};
