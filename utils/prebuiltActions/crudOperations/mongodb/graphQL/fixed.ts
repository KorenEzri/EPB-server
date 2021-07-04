import * as mongoUtils from "../util";
import * as utils from "../../../../utils";

const getMongooseMethod = (
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
export const createOne = async (
  Model: string,
  action: string,
  resolverType: string,
  identifier: { name: string; type: string }
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Schema",
    ""
  );
  const modelParent = utils.replaceAllInString(Model, "Schema", "Model");
  const modelInstance = `${onlyModelName}Instance`;
  const modelVariableType = `${onlyModelName}Options`;
  const resolver = `
  ${mongoUtils.generateResolverName(
    Model,
    action
  )}: async (_:any, ${onlyModelName}:${modelVariableType}) => {
        const ${modelInstance} = new ${modelParent}(${onlyModelName})
        try {
            await ${modelInstance}.${getMongooseMethod(
    action,
    identifier,
    onlyModelName
  )};
            return 'OK'
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;
  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
export const createMany = async (
  Model: string,
  action: string,
  resolverType: string
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Schema",
    ""
  );
  const modelParent = utils.replaceAllInString(Model, "Schema", "Model");
  const modelVariableType = `${onlyModelName}Options`;
  const resolver = `
  ${mongoUtils.generateResolverName(
    Model,
    action
  )}s: async (_:any, ${onlyModelName}s:${modelVariableType}[]) => {
        try {
            await ${modelParent}.insertMany(${onlyModelName}s);
            return 'OK'
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;

  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
export const readOne = async (
  Model: string,
  action: string,
  resolverType: string,
  identifier: { name: string; type: string }
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const modelParent = utils.replaceAllInString(Model, "Schema", "Model");
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Schema",
    ""
  );
  const modelInstance = `${onlyModelName}Instance`;
  const resolver = `
  ${mongoUtils.generateResolverName(Model, action)}: async (_:any, ${
    identifier.name
  }:${identifier.type}) => {
        try {
          const ${modelInstance} = await ${modelParent}.findOne({${
    identifier.name
  }:${identifier.name}});
            return ${modelInstance}
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;

  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
export const readMany = async (
  Model: string,
  action: string,
  resolverType: string,
  identifier: { name: string; type: string }
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const modelParent = utils.replaceAllInString(Model, "Schema", "Model");
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Schema",
    ""
  );
  const modelInstance = `${onlyModelName}Instance`;
  const resolver = `
  ${mongoUtils.generateResolverName(Model, action)}s: async (_:any, ${
    identifier.name
  }:${identifier.type}) => {
        try {
          const ${modelInstance}s = await ${modelParent}.find({${
    identifier.name
  }:${identifier.name}});
            return ${modelInstance}s
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;

  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
export const readAll = async (
  Model: string,
  action: string,
  resolverType: string
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Schema",
    ""
  );
  const modelParent = utils.replaceAllInString(Model, "Schema", "Model");
  const modelInstance = `${onlyModelName}Instance`;
  const resolver = `
  ${mongoUtils.generateResolverName(Model, action)}s: async () => {
        try {
          const ${modelInstance}s = await ${modelParent}.find();
            return ${modelInstance}s
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;

  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
export const updateOne = async (
  Model: string,
  action: string,
  resolverType: string,
  identifier: { name: string; type: string }
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const updateVar = utils.replaceAllInString(lowerCaseModelName, "Schema", "");
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Schema",
    "Model"
  );
  const updatedInstance = `${updateVar}Options`;
  const resolver = `
  ${mongoUtils.generateResolverName(Model, action)}: async (_:any, ${
    identifier.name
  }:${identifier.type}, ${updateVar}: ${updatedInstance}) => {
        try {
         await ${utils.capitalizeFirstLetter(onlyModelName)}.updateOne({${
    identifier.name
  }:${identifier.name}}, ${updateVar});
            return 'OK'
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;

  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
export const deleteOne = async (
  Model: string,
  action: string,
  resolverType: string,
  identifier: { name: string; type: string }
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Schema",
    "Model"
  );
  const modelInstance = `${onlyModelName}Instance`;
  const resolver = `
  ${mongoUtils.generateResolverName(Model, action)}: async (_:any, ${
    identifier.name
  }:${identifier.type}) => {
        try {
          const ${modelInstance} = await ${utils.capitalizeFirstLetter(
    onlyModelName
  )}.deleteOne({${identifier.name}:${identifier.name}});
            return 'OK'
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;

  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
export const deleteMany = async (
  Model: string,
  action: string,
  resolverType: string,
  identifier: { name: string; type: string }
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const modelParent = utils.replaceAllInString(Model, "Schema", "Model");
  const resolver = `
  ${mongoUtils.generateResolverName(Model, action)}s: async (_:any, ${
    identifier.name
  }:${identifier.type}) => {
        try {
            await ${modelParent}.deleteMany({${identifier.name}:${
    identifier.name
  }});
            return 'OK'
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;

  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
// export const updateMany = async (
//   Model: string,
//   action: string,
//   resolverType: string,
//   identifier: {name: string, type: string }
// ) => {
//   Model = utils.capitalizeFirstLetter(Model);
//   const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
//   const onlyModelName = utils.replaceAllInString(
//     lowerCaseModelName,
//     "Model",
//     ""
//   );
//   const modelInstance = `${onlyModelName}Instance`;
//   const resolver = `
//   ${mongoUtils.generateResolverName(Model, action)}: async (_:any, ${
//     identifier.name
//   }:${identifier.type}, ) => {
//         try {
//           const ${modelInstance} = await ${Model}.findOneAndUpdate({${
//     identifier.name
//   }:${identifier.type}}, {${onlyModelName}});({${identifier.name}:${
//     identifier.type
//   }});
//             return ${modelInstance}
//         }
//         catch ({message}) {
//                Logger ? Logger.error(message) : console.log(message)
//                 return message
//         }
//     } `;

//   await mongoUtils.writeResolverIntoFile(resolver, resolverType);
//   return;
// };
