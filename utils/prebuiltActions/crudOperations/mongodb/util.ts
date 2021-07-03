import fs from "fs";
import { promisify } from "util";
import * as utils from "../../../utils";
const write = promisify(fs.writeFile);
import { getResolvers } from "../../../codeToString";

export const generateResolverName = (Model: string, action: string) => {
  Model = Model.split("Model").join("");
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
  const finishedResolvers = utils.insertToString(
    allResolversAsString,
    resolver,
    type,
    "//"
  );
  await write("./resolvers.ts", finishedResolvers);
};
export const mongooseMethods = {
  CreateOne: "save()",
  CreateMany: (arr: any[]) => `insertMany(${arr})`,
  ReadOne: (identifier: { name: string; value: any }) =>
    `findOne({${identifier.name}:${identifier.value}})`,
  ReadMany: (identifier: { name: string; value: any }) =>
    `findMany({${identifier.name}:${identifier.value}})`,
  ReadAll: "find()",
  UpdateOne: (identifier: { name: string; value: any }) =>
    `updateOne({${identifier.name}:${identifier.value}})`,
  UpdateMany: "NOT SUPPORTED",
  DeleteOne: (identifier: { name: string; value: any }) =>
    `deleteOne({${identifier.name}:${identifier.value}})`,
  DeleteMany: "deleteMany()",
};
