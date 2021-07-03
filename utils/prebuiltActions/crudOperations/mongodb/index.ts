import Logger from "../../../../logger/logger";
import {
  generateResolver,
  generateResolverForManyCRUD,
} from "./graphQL/resolvers";
import {
  generateTypedef,
  generateTypedefForManyCRUD,
} from "./graphQL/typeDefs";
const mutationCRUDS = [
  "CreateOne",
  "CreateMany",
  "UpdateOne",
  "UpdateMany",
  "DeleteOne",
  "DeleteMany",
];

export const mongoCRUDS = {
  single: async (
    Model: string,
    action: string,
    identifier: { name: string; value: any }
  ) => {
    try {
      await generateResolver(
        Model,
        action,
        mutationCRUDS.includes(action) ? "Mutation" : "Query",
        identifier
      );
      await generateTypedef(
        Model,
        action,
        mutationCRUDS.includes(action) ? "input" : "type"
      );
    } catch ({ message }) {
      Logger.error(message);
    }
  },
  many: async (Model: string, action: string) => {
    try {
      await generateResolverForManyCRUD(
        Model,
        action,
        mutationCRUDS.includes(action) ? "Mutation" : "Query"
      );
      await generateTypedefForManyCRUD(
        Model,
        action,
        mutationCRUDS.includes(action) ? "input" : "type"
      );
    } catch ({ message }) {
      Logger.error(message);
    }
  },
};
