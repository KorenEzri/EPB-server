import { GraphQLScalarType } from "graphql";
// option types
import { ResolverOptions, createCustomTypeOptions, stub } from "./types";
import { getResolvers, getTypeDefs, getActions } from "./utils/codeToString";
import * as create from "./utils/createNew";
import Logger from "./logger/logger";

const dateScalar = new GraphQLScalarType({
  name: "Date",
  parseValue(value: string | number | Date) {
    return new Date(value);
  },
  serialize(value: { toISOString: () => any }) {
    return value.toISOString();
  },
});
export const resolvers = {
  Date: dateScalar,
  Query: {
    // Action: get all resolvers
    getResolvers: async () => {
      Logger.info("HERE2");
      return await getResolvers();
    },
    // Action: get all type definitions
    getTypeDefs: async () => {
      Logger.info("HERE3");
      return await getTypeDefs();
    },
    // Action: get all actions
    getActions: async () => {
      Logger.info("HERE4");
      return await getActions();
    },
    // query-end
  },
  Mutation: {
    // Action: create a new resolver (empty)
    createResolver: async (_: any, { options }: ResolverOptions) => {
      try {
        Logger.info("Creating a new type definition...");
        await create.createNewTypeDef({ options: options });
        Logger.info("Creating a new resolver...");
        await create.createNewResolver({ options: options });
        Logger.info("Action created successfully.");
        return "OK";
      } catch ({ message }) {
        Logger.error(message);
        return "ERROR";
      }
    },
    // Action: create a new type definition (singular)
    createCustomType: async (_: any, { options }: createCustomTypeOptions) => {
      //
      // return String
    },
    // mutation-end
  },
};
