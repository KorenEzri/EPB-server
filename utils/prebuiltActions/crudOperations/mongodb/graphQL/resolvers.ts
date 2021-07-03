import * as mongoUtils from "../util";
import * as utils from "../../../../utils";

export const createOne = async (Model: string, action: string) => {
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
            await ${modelInstance}.${mongoUtils.mongooseMethods.CreateOne};
            return 'OK'
        }
        catch ({message}) {
               Logger ? Logger.error(message) : console.log(message)
                return message
        }
    } `;
  await mongoUtils.writeResolverIntoFile(resolver, "Mutation");
};
