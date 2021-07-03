import Logger from "../../../../logger/logger";
import { createOne } from "./graphQL/resolvers";
import { createOneTypeDef } from "./graphQL/typeDefs";

export const mongoCRUDS = {
  createOne: async (Model: string, action: string) => {
    try {
      await createOne(Model, action);
      await createOneTypeDef(Model);
    } catch ({ message }) {
      Logger.error(message);
    }
  },
};
