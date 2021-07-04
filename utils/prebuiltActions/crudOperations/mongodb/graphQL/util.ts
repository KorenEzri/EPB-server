import {
  resolverBodyOptions,
  resolverTitleOptions,
  resolverTryCatchBlockOptions,
} from "../../../../../types";

export const resolverTitles = {
  createOne: (parts: resolverTitleOptions) =>
    `${parts.resolverName}: async (_: any, ${parts.modelFunctionVarName}: ${parts.modelInterfaceName}) => {`,
  createMany: (parts: resolverTitleOptions) =>
    `${parts.resolverName}s: async (_: any, ${parts.modelFunctionVarName}s: ${parts.modelInterfaceName}[]) => {`,
  readOne: (parts: resolverTitleOptions) =>
    `${parts.resolverName}: async (_:any, ${parts.identifier?.name}: ${parts.identifier?.type}) => {`,
  readMany: (parts: resolverTitleOptions) =>
    `${parts.resolverName}s: async (_: any, ${parts.identifier?.name}: ${parts.identifier?.type}) => {`,
  readAll: (parts: resolverTitleOptions) =>
    `${parts.resolverName}s: async () => {`,
  updateOne: (parts: resolverTitleOptions) =>
    `${parts.resolverName}: async (_:any, ${parts.identifier?.name}:${parts.identifier?.type}, ${parts.modelFunctionVarName}: ${parts.modelInterfaceName}) => {`,
  deleteOne: (parts: resolverTitleOptions) =>
    `${parts.resolverName}: async (_:any, ${parts.identifier?.name}: ${parts.identifier?.type}) => {`,
  deleteMany: (parts: resolverTitleOptions) =>
    `${parts.resolverName}s: async (_: any, ${parts.identifier?.name}: ${parts.identifier?.type}) => {`,
};
export const resolverTryCatchBlocks = {
  createOne: (parts: resolverTryCatchBlockOptions) =>
    `\n try {
        await ${parts.modelInstaceName}.${parts.mongooseMethod}
      }
        catch ({ message }) {
            Logger ? Logger.error(message) : console.log(message)
            return message
      }`,
  createMany: (parts: resolverTryCatchBlockOptions) =>
    `\n try {
        await ${parts.mongoDBModelObjectName}.insertMany(${parts.modelFunctionVarName}s);
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
              {${parts.identifier?.name}: ${parts.identifier?.name}}, ${parts.modelFunctionVarName}
          )
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
    ` const ${parts.modelInstaceName} = new ${parts.mongoDBModelObjectName} ({${parts.modelFunctionVarName}}) ${parts.resolverTryCatchBlock}`,
  createMany: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  readOne: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  readMany: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  readAll: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  updateOne: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  deleteOne: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
  deleteMany: (parts: resolverBodyOptions) => `${parts.resolverTryCatchBlock}`,
};