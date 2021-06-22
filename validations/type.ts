import Joi from "joi";
import { validTypes, validResolverTypes } from "../consts";
import { resolvers } from "../resolvers";
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
