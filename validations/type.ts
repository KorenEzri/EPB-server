import Joi from "joi";
import Logger from "../logger/logger";
import { resolvers } from "../resolvers";
import { validateVars, validateUnique, parseOptions } from "./validation.util";
export let allTypeNames = [""];
const interval = setInterval(() => {
  try {
    const allQueries = Object.keys(resolvers.Query);
    const allMutations = Object.keys(resolvers.Mutation);
    if (allQueries && allMutations)
      allTypeNames = allQueries.concat(allMutations);
    if (allTypeNames) {
      typeSchema = Joi.object({
        name: Joi.string()
          .required()
          .invalid(...allTypeNames),
        properties: Joi.array(),
        comment: Joi.string().allow(""),
        dbSchema: Joi.boolean(),
        typeDef: Joi.boolean(),
        type: Joi.string(),
      });
      clearInterval(interval);
    }
  } catch ({ message }) {}
}, 300);

export let typeSchema = Joi.object({
  comment: Joi.string().allow(""),
});
export const validateTypeCreation = async (options: any) => {
  const varsValid = validateVars(options);
  if (varsValid) return varsValid;
  // const uniqueValid = await validateUnique(options);
  // if (uniqueValid) return uniqueValid;
  const parsedOptions = parseOptions(options);
  const { error, value } = typeSchema.validate(parsedOptions);
  if (error) {
    Logger.error(
      `FROM: EPB-server: Invalid type info received, aborting.. Error: ${error.message}`
    );
    return { error: true, message: error.message };
  } else return { error: false, message: "OK" };
};
