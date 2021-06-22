import Joi from "joi";
import Logger from "../logger/logger";
import { validTypes, validResolverTypes } from "../consts";
import { allTypeNames } from "./";
import { validateVars, validateUnique, parseOptions } from "./validation.util";

const interval = setInterval(() => {
  try {
    if (allTypeNames.length) {
      resolverSchema = Joi.object({
        name: Joi.string()
          .required()
          .invalid(...allTypeNames),
        type: Joi.string()
          .required()
          .valid(...validResolverTypes),
        returnType: Joi.string()
          .required()
          .valid(...validTypes),
        description: Joi.string().required(),
        properties: Joi.array()
          .allow(null)
          .items(Joi.string().valid(...validTypes)),
        comment: Joi.string().allow(""),
      });
      clearInterval(interval);
    }
  } catch ({ message }) {}
}, 300);

export let resolverSchema = Joi.object({
  comment: Joi.string().allow(""),
});
export const validateResolverCreation = async (options: any) => {
  const varsValid = validateVars(options);
  if (varsValid) return varsValid;
  const uniqueValid = await validateUnique(options);
  if (uniqueValid) return uniqueValid;
  const parsedOptions = parseOptions(options);
  const { error, value } = resolverSchema.validate(parsedOptions);
  if (error) {
    Logger.error(
      `FROM: EPB-server: Invalid resolver info received, aborting.. Error: ${error.message}`
    );
    return { error: true, message: error.message };
  } else return { error: false, message: "OK" };
};
