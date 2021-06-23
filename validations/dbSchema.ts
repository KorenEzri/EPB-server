import Joi from "joi";
import { createSchemaOptions } from "../types";
import {
  parseOptions,
  validateUniqueSchemaName,
  validateVars,
} from "./validation.util";
import Logger from "../logger/logger";

export const dbJoiSchema = Joi.object({
  name: Joi.string().required(),
  properties: Joi.array(),
  comment: Joi.string().allow(""),
  typeDef: Joi.boolean(),
  dbSchema: Joi.boolean(),
  type: Joi.string(),
  uniqueIdentifiers: Joi.array(),
});

export const validateSchemaCreation = async (options: createSchemaOptions) => {
  const varsValid = validateVars(options.options);
  if (varsValid) return varsValid;
  const uniqueValid = validateUniqueSchemaName(options.options);
  if (uniqueValid) return uniqueValid;
  const parsedOptions = parseOptions(options.options);
  const { error, value } = dbJoiSchema.validate(parsedOptions);
  if (error) {
    Logger.error(
      `FROM: EPB-server: Invalid Schema info received, aborting.. Error: ${error.message}`
    );
    return { error: true, message: error.message };
  } else return { error: false, message: "OK" };
};
