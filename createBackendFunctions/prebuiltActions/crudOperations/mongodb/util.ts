import fs from "fs";
import { promisify } from "util";
import * as utils from "../../../utils";
import {
  resolverBodyOptions,
  resolverTitleOptions,
  resolverTryCatchBlockOptions,
} from "../../../../types";
import { getResolvers } from "../../../codeToString";
const write = promisify(fs.writeFile);

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

export const resolverTitles = {
  createOne: (parts: resolverTitleOptions) =>
    `// Action: Create one ${parts.modelInterfaceName} Instance \n ${parts.resolverName}: async (_: any, { options }: { options: ${parts.modelInterfaceName} } ) => {`,

  createMany: (parts: resolverTitleOptions) =>
    `// Action: Create many ${parts.modelInterfaceName} Instances \n ${parts.resolverName}s: async (_: any, { options }: { options: ${parts.modelInterfaceName}[] }) => {`,

  readOne: (parts: resolverTitleOptions) =>
    `\n// Action: Read one ${
      parts.modelInterfaceName
    } Instance, based on an identifying property. \n\n ${
      parts.resolverName
    }: async (_:any, { ${parts.identifier?.name} }: { ${
      parts.identifier?.name
    } :${utils.lowercaseFirstLetter(parts.identifier?.type || "")} }) => {`,

  readMany: (parts: resolverTitleOptions) =>
    `\n// Action: Read many ${
      parts.modelInterfaceName
    } Instances, based on an identifying property. \n\n ${
      parts.resolverName
    }s: async (_: any, { ${parts.identifier?.name} }: { ${
      parts.identifier?.name
    } :${utils.lowercaseFirstLetter(parts.identifier?.type || "")} }) => {`,

  readAll: (parts: resolverTitleOptions) =>
    `\n// Action: Read all ${parts.modelInterfaceName} Instances \n\n ${parts.resolverName}s: async () => {`,

  updateOne: (parts: resolverTitleOptions) =>
    `// Action: Update one ${
      parts.modelInterfaceName
    } Instance, based on an identifying property \n ${
      parts.resolverName
    }: async (_:any, { ${parts.identifier?.name} }: { ${
      parts.identifier?.name
    } :${utils.lowercaseFirstLetter(
      parts.identifier?.type || ""
    )} }, { options }: { options: ${parts.modelInterfaceName} } ) => {`,

  deleteOne: (parts: resolverTitleOptions) =>
    `// Action: Delete one ${
      parts.modelInterfaceName
    } Instance, based on an identifying property \n ${
      parts.resolverName
    }: async (_:any, { ${parts.identifier?.name} }: { ${
      parts.identifier?.name
    } :${utils.lowercaseFirstLetter(parts.identifier?.type || "")} }) => {`,

  deleteMany: (parts: resolverTitleOptions) =>
    `// Action: Delete many ${
      parts.modelInterfaceName
    } Instances, based on an identifying property \n ${
      parts.resolverName
    }s: async (_: any, { ${parts.identifier?.name} }: { ${
      parts.identifier?.name
    } :${utils.lowercaseFirstLetter(parts.identifier?.type || "")} }) => {`,
};
export const resolverTryCatchBlocks = {
  createOne: (parts: resolverTryCatchBlockOptions) =>
    `\n try {
        await ${parts.modelInstaceName}.${parts.mongooseMethod}
        return "OK"
      }
        catch ({ message }) {
            Logger ? Logger.error(message) : console.log(message)
            return message
      }`,
  createMany: (parts: resolverTryCatchBlockOptions) =>
    `\n try {
        await ${parts.mongoDBModelObjectName}.insertMany(options);
        return 'OK'
    }
    catch ({ message }) {
        Logger ? Logger.error(message) : console.log(message)
        return message
    }`,
  readOne: (parts: resolverTryCatchBlockOptions) =>
    `\n try {
        const ${parts.modelInstaceName} = await ${parts.mongoDBModelObjectName}.findOne({${parts.identifier?.name}:${parts.identifier?.name}});
        return ${parts.modelInstaceName}
    }
    catch ({ message }) {
        Logger ? Logger.error(message) : console.log(message)
        return message
    }`,
  readMany: (parts: resolverTryCatchBlockOptions) =>
    `
      \n try {
          const ${parts.modelInstaceName}s = await ${parts.mongoDBModelObjectName}.find({${parts.identifier?.name}: ${parts.identifier?.name}})
          return ${parts.modelInstaceName}s
      }
      catch ({ message }) {
          Logger ? Logger.error(message) : console.log(message)
          return message
      }
      `,
  readAll: (parts: resolverTryCatchBlockOptions) =>
    `
      \n try {
        const ${parts.modelInstaceName}s = await ${parts.mongoDBModelObjectName}.find();
        return ${parts.modelInstaceName}s
    }
    catch ({ message }) {
        Logger ? Logger.error(message) : console.log(message)
        return message
    }
      `,
  updateOne: (parts: resolverTryCatchBlockOptions) =>
    `
      \n try {
          await ${parts.mongoDBModelObjectName}.updateOne(
              {${parts.identifier?.name}: ${parts.identifier?.name}}, options
          )
          return "OK";
      }
      catch ({ message }) {
        Logger ? Logger.error(message) : console.log(message)
        return message
    }
      `,
  deleteOne: (parts: resolverTryCatchBlockOptions) =>
    `
      \n try {
          await ${parts.mongoDBModelObjectName}.deleteOne({${parts.identifier?.name}: ${parts.identifier?.name}});
          return 'OK'
      }
      catch ({ message }) {
        Logger ? Logger.error(message) : console.log(message)
        return message
    }
      `,
  deleteMany: (parts: resolverTryCatchBlockOptions) =>
    `
      \n try {
          await ${parts.mongoDBModelObjectName}.deleteMany({${parts.identifier?.name}: ${parts.identifier?.name}});
          return 'OK';
      }
      catch ({ message }) {
        Logger ? Logger.error(message) : console.log(message)
        return message
    }
      `,
};
export const resolverBodies = {
  createOne: (parts: resolverBodyOptions) =>
    ` const ${parts.modelInstaceName} = new ${parts.mongoDBModelObjectName} ( options ) ${parts.resolverTryCatchBlock}`,
  createMany: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  readOne: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  readMany: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  readAll: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  updateOne: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  deleteOne: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  deleteMany: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
};
