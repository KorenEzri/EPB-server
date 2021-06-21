import Joi from "joi";
import { validTypes, validResolverTypes } from "../consts";
import { getResolverNames, getTypeDefs } from "../utils/codeToString";
import { compileToVarList } from "../utils/createNew/string.util";
import { allTypeNames } from "./";
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
        vars: Joi.array()
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
export const validatePropertyNames = async (options: any, getter: string) => {
  const setArray = Array.from(
    new Set(options[getter].map((v: string) => v.split(":")[0].toLowerCase()))
  );
  const optionsArray = options[getter];
  if (setArray.length !== optionsArray.length) {
    return {
      error: true,
      message: "an interface cannot have two identical property names!",
    };
  }
  const allResolverNames = await getResolverNames();
  const allTypeDefs = await getTypeDefs();
  if (allResolverNames && allResolverNames.includes(`${options.name}Options`))
    return {
      error: true,
      message: "duplicate definitions detected, aborting.",
    };
  if (allTypeDefs && allTypeDefs.includes(`${options.name}Options`))
    return {
      error: true,
      message: "duplicate definitions detected, aborting.",
    };

  const validateOpts: any = {};
  Object.assign(validateOpts, options);
  validateOpts[getter] = compileToVarList(options[getter]).map((prop) =>
    prop.type.trim()
  );
  return validateOpts;
};
