import Joi from "joi";
import { validTypes } from "../consts";
import {
  parseOptions,
  validateUniqueSchemaName,
  validateVars,
} from "./validation.util";
import Logger from "../logger/logger";

// name: string,
// properties: [string],
// comment: string,
// typeDef: boolean,
// dbSchema: boolean,
// type: string,
// uniqueProperty: string

export const dbJoiSchema = Joi.object({
  name: Joi.string().required(),
  properties: Joi.array()
    .allow(null)
    .items(Joi.string().valid(...validTypes)),
  comment: Joi.string().allow(""),
  typeDef: Joi.boolean(),
  dbSchema: Joi.boolean(),
  type: Joi.string(),
  uniqueProperty: Joi.string(),
});

export const validateSchemaCreation = async (options: any) => {
  const varsValid = validateVars(options);
  if (varsValid) return varsValid;
  const uniqueValid = validateUniqueSchemaName(options);
  if (uniqueValid) return uniqueValid;
  const parsedOptions = parseOptions(options);
  const { error, value } = dbJoiSchema.validate(parsedOptions);
  if (error) {
    Logger.error(
      `FROM: EPB-server: Invalid resolver info received, aborting.. Error: ${error.message}`
    );
    return { error: true, message: error.message };
  } else return { error: false, message: "OK" };
};
