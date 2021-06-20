import { GraphQLScalarType } from "graphql";
import { ResolverOptions } from "./types";
import { getResolvers, getTypeDefs, getActions } from "./utils/codeToString";
import * as create from "./utils/createNew";
import Logger from "./logger/logger";
//

// generated interfaces
// generated interfaces end

//
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
    getResolvers: async () => {
      return await getResolvers(); // Action: get all resolvers
    },
    getTypeDefs: async () => {
      return await getTypeDefs(); // Action: get all type definitions
    },
    getActions: async () => {
      return await getActions(); // Action: get all actions
    },
    // query-end
  },
  Mutation: {
    createResolver: async (_: any, { options }: ResolverOptions) => {
      await create.createNewTypeDef({ options: options });
      await create.createNewResolver({ options: options });
      return "OK"; // Action: create a new resolver (empty)
    },
    // mutation-end
  },
};
