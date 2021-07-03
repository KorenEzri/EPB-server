import * as mongoUtils from "../util";
import * as utils from "../../../../utils";

const getMongooseMethod = (
  action: string,
  identifier: { name: string; value: any }
) => {
  switch (action) {
    case "Create One":
      return mongoUtils.mongooseMethods.CreateOne;
    case "Create Many":
      // return mongoUtils.mongooseMethods.CreateMany;
      return mongoUtils.mongooseMethods.CreateOne;
    case "Read One":
      return mongoUtils.mongooseMethods.ReadOne(identifier);

    case "Read Many":
      return mongoUtils.mongooseMethods.CreateOne;

    case "Read All":
      return mongoUtils.mongooseMethods.CreateOne;

    case "Update One":
      return mongoUtils.mongooseMethods.CreateOne;

    case "Update Many":
      return mongoUtils.mongooseMethods.CreateOne;

    case "Delete One":
      return mongoUtils.mongooseMethods.CreateOne;

    case "Delete Many":
      return mongoUtils.mongooseMethods.CreateOne;

    default:
      break;
  }
};

export const generateResolver = async (
  Model: string,
  action: string,
  resolverType: string,
  identifier: { name: string; value: any }
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Model",
    ""
  );
  const modelInstance = `${onlyModelName}Instance`;
  const modelVariable = `${onlyModelName}Options`;
  const resolver = `
  ${mongoUtils.generateResolverName(
    Model,
    action
  )}: async (_:any, ${onlyModelName}:${modelVariable}) => {
        const ${modelInstance} = new ${Model}(${onlyModelName})
        try {
            await ${modelInstance}.${getMongooseMethod(action, identifier)};
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
export const generateResolverForManyCRUD = async (
  Model: string,
  action: string,
  resolverType: string
) => {
  Model = utils.capitalizeFirstLetter(Model);
  const lowerCaseModelName = utils.lowercaseFirstLetter(Model);
  const onlyModelName = utils.replaceAllInString(
    lowerCaseModelName,
    "Model",
    ""
  );
  const modelInstance = `${onlyModelName}Instance`;
  const modelVariable = `${onlyModelName}Options`;
  const resolver = `
  ${mongoUtils.generateResolverName(
    Model,
    action
  )}: async (_:any, ${onlyModelName}s:${modelVariable}[]) => {
      const errors = await Promise.all(${onlyModelName}s.map( async (model) => {
        const ${modelInstance} = new ${Model}(model)
        try {
            await ${modelInstance}.${mongoUtils.mongooseMethods.CreateOne};
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }

      }))
      return errors ? errors : 'OK'
    } `;
  await mongoUtils.writeResolverIntoFile(resolver, resolverType);
  return;
};
