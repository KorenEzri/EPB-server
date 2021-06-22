import Joi from "joi";
import { validTypes, validResolverTypes } from "../consts";
import { getResolverNames, getTypeDefs } from "../utils/codeToString";
import { resolvers } from "../resolvers";
import { compileToVarList } from "../utils/createNew/string.util";
import { allTypeNames, typeSchema } from "./";
import Logger from "../logger/logger";
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

export const validateVars = (options: any, getter: string) => {
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
};
const validateUnique = async (options: any) => {
  const allResolverNames = await getResolverNames();
  const allTypeDefs = await getTypeDefs();
  const queriesAndResolvers = Object.keys(resolvers.Query).concat(
    Object.keys(resolvers.Mutation)
  );
  if (allResolverNames) {
    if (allResolverNames.includes(`${options.name}Options`))
      return {
        error: true,
        message: "duplicate definitions detected, aborting.",
      };
    if (allResolverNames.includes(`${options.name}`))
      return {
        error: true,
        message: "duplicate definitions detected, aborting.",
      };
  }
  if (allTypeDefs) {
    if (allTypeDefs.includes(`${options.name}Options`))
      return {
        error: true,
        message: "duplicate definitions detected, aborting.",
      };
    if (allTypeDefs.includes(`${options.name}`))
      return {
        error: true,
        message: "duplicate definitions detected, aborting.",
      };
  }
  if (queriesAndResolvers.includes(`${options.name}Options`))
    return {
      error: true,
      message: "duplicate definitions detected, aborting.",
    };
  if (queriesAndResolvers.includes(`${options.name}`))
    return {
      error: true,
      message: "duplicate definitions detected, aborting.",
    };
};
export const validateCreationQuery = async (options: any, getter: string) => {
  const varsValid = validateVars(options, getter);
  if (varsValid) return varsValid;
  const uniqueValid = await validateUnique(options);
  if (uniqueValid) return uniqueValid;
  const validateOpts: any = {};
  Object.assign(validateOpts, options);
  validateOpts[getter] = compileToVarList(options[getter]).map((prop) =>
    prop.type.trim()
  );
  const { error, value } = typeSchema.validate(validateOpts);
  if (error) {
    Logger.error(
      `FROM: EPB-server: Invalid resolver info received, aborting.. Error: ${error.message}`
    );
    return { error: true, message: error.message };
  } else return { error: false, message: "OK" };
};
