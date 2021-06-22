import Joi from "joi";
import { validateVars } from "./resolver";
import { createSchemaOptions } from "../types";
import * as schemas from "../db/schemas";
import Logger from "../logger/logger";
import { validResolverTypes, validTypes } from "../consts";
const validateUnique = ({ options }: createSchemaOptions) => {
  const allSchemas = Object.keys(schemas);
  if (allSchemas.includes(`${options.name}Schema`))
    return {
      error: true,
      message: "duplicate schemas detected, aborting.",
    };
};

// name: string,
// properties: [string],
// comment: string,
// typeDef: boolean,
// dbSchema: boolean,
// type: string,
// uniqueProperty: string

export const dbJoiSchema = Joi.object({
  name: Joi.string().required(),
  returnType: Joi.string()
    .required()
    .valid(...validTypes),
  description: Joi.string().required(),
  properties: Joi.array()
    .allow(null)
    .items(Joi.string().valid(...validTypes)),
  comment: Joi.string().allow(""),
});

export const validateDBSchemaQuery = async (options: createSchemaOptions) => {
  const varsValid = validateVars(options, "properties");
  if (varsValid) return varsValid;
  const uniqueValid = validateUnique(options);
  if (uniqueValid) return uniqueValid;
};
