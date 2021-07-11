import { GraphQLScalarType } from "graphql";
import * as presentationUtils from "./presentation-utils";

export const resolvers = {
  Query: {
    What: () => {
      return presentationUtils.What();
    },
    Why: () => {
      return presentationUtils.Why();
    },
  },
  Mutation: {
    How: () => {
      return presentationUtils.How();
    },
  },
};
