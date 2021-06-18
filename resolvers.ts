import { GraphQLScalarType } from "graphql";
import Logger from "./logger/logger";
import { getResolvers, getTypeDefs, getActions } from "./utils/codeToString";

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
  },
};
