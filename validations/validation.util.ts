import { resolvers } from "../resolvers";
import { getResolverNames, getTypeDefs } from "../utils/codeToString";
import * as types from "../types";
import Joi from "joi";

export const validateVars = (options: any) => {
  const setArray = Array.from(
    new Set(
      options.properties.map((v: string) => v.split(":")[0].toLowerCase())
    )
  );
  const optionsArray = options.properties;
  if (setArray.length !== optionsArray.length) {
    return {
      error: true,
      message: "an interface cannot have two identical property names!",
    };
  }
};
export const validateUnique = async (options: any) => {
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
export const parseOptions = (
  options:
    | types.ResolverOptions
    | types.createCustomTypeOptions
    | types.createSchemaOptions
) => {
  const validateOpts: any = {};
  Object.assign(validateOpts, options);
  const varList = validateOpts.properties.map((variable: string) => {
    const splat = variable.split(":");
    const varb = splat[0];
    const varType = splat[1];
    return { var: varb, type: varType };
  });
  validateOpts.properties = varList.map(
    (property: { var: string; type: string }) => property.type.trim()
  );
  return validateOpts;
};
