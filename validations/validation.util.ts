import { resolvers } from "../resolvers";
import { createSchemaOptions } from "../types";
import { validTypes } from "../consts";
import { getResolverNames, getTypeDefs } from "../utils/codeToString";
import * as schemas from "../db/schemas";
import * as types from "../types";
import Joi from "joi";
import Logger from "../logger/logger";
import { replaceAllInString } from "../utils/createNew/string.util";

const typeSchema = Joi.object({
  types: Joi.array().items(Joi.string().valid(...validTypes)),
});
const validateTypeList = (typeList: string[]) => {
  let allTypes: string[] = [];
  allTypes = replaceAllInString(typeList.join(","), "||", ",").split(",");
  allTypes = replaceAllInString(allTypes.join(","), "|", ",").split(",");
  allTypes = allTypes.map((type: string) => type.trim());
  const { error, value } = typeSchema.validate({ types: allTypes });
  if (error) {
    Logger.error(
      `FROM: EPB-server: Invalid typeList info received for validateTypeList() @ validation.util.ts ~line 24.\naborting.. Error: ${error.message}`
    );
    return { error: true, message: error.message };
  }
};
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
  let varList: { var: string; type: string }[] = [];
  varList = validateOpts.properties.map((variable: string) => {
    const splat = variable.split(":");
    const varName = splat[0];
    const varType = splat[1];
    return { var: varName, type: varType };
  });
  validateOpts.properties = varList.map(
    (property: { var: string; type: string }) => property.type.trim()
  );
  const error = validateTypeList(validateOpts.properties);
  if (error) return error;
  const returnType = validateOpts.returnType;
  if (returnType) {
    if (returnType.split("|").length) {
      const error = validateTypeList([returnType.split(":")[1]]);
      if (error) return error;
    }
  }
  return validateOpts;
};
export const validateUniqueSchemaName = ({ options }: createSchemaOptions) => {
  const allSchemas = Object.keys(schemas);
  if (allSchemas.includes(`${options.name}Schema`))
    return {
      error: true,
      message: "duplicate schemas detected, aborting.",
    };
};
