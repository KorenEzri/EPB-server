import Joi from "joi";
import { validTypes } from "../consts";
import Logger from "../logger/logger";
import { resolvers } from "../resolvers";
import { compileToVarList } from "../utils/createNew/string.util";
import { validateVars, validateUnique } from "./validation.util";
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
        properties: Joi.array()
          .required()
          .items(Joi.string().valid(...validTypes)),
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
  const uniqueValid = await validateUnique(options);
  if (uniqueValid) return uniqueValid;
  const validateOpts: any = {};
  Object.assign(validateOpts, options);
  validateOpts.properties = compileToVarList(options.properties).map((prop) =>
    prop.type.trim()
  );
  const { error, value } = typeSchema.validate(validateOpts);
  if (error) {
    Logger.error(
      `FROM: EPB-server: Invalid type info received, aborting.. Error: ${error.message}`
    );
    return { error: true, message: error.message };
  } else return { error: false, message: "OK" };
};
