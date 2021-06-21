import { GraphQLScalarType } from "graphql";
import execa from "execa";
// TODO:
//  - code cleanup
//  - fix prettier problem with resolvers
//  - finish adding custom types and DB schemas
//  - validations for all

import {
  resolverSchema,
  typeSchema,
  validateCreationQuery,
} from "./validations";
// option types
import { ResolverOptions, createCustomTypeOptions, stub } from "./types";
import {
  getResolvers,
  getTypeDefs,
  getActions,
  getResolverNames,
} from "./utils/codeToString";
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
      return await getResolvers();
    },
    // Action: get all type definitions
    getTypeDefs: async () => {
      return await getTypeDefs();
    },
    // Action: get all actions
    getActions: async () => {
      return await getActions();
    },

    // Action: get all resolver names
    getAllResolverNames: async (_: any) => {
      return await getResolverNames();
    },

    // query-end
  },
  Mutation: {
    // Action: create a new resolver (empty)
    createResolver: async (_: any, { options }: ResolverOptions) => {
      const validationRes = await validateCreationQuery(options, "vars");
      if (validationRes.error) return validationRes.message;
      const { error, value } = resolverSchema.validate(validationRes);
      if (error) {
        Logger.error(
          `FROM: EPB-server: Invalid resolver info received, aborting.. Error: ${error.message}`
        );
        return error.message;
      }
      try {
        Logger.http("FROM: EPB-server: Creating a new type definition...");
        let res = await create.createNewTypeDef({ options: options });
        Logger.http("FROM: EPB-server: Creating a new resolver...");
        if (!res) res = await create.createNewResolver({ options: options });
        Logger.http(
          "FROM: EPB-server: Action created successfully, applying Prettier for files.."
        );
        try {
          await execa("npx prettier --write *.ts");
        } catch ({ message }) {
          Logger.error(`FROM: EPB-server: ${message}`);
        }
        if (!res) return "OK";
        return "ERROR";
      } catch ({ message }) {
        Logger.error(`FROM: EPB-server: ${message}`);
        return "ERROR";
      }
    },
    // Action: create a new type definition (singular)
    createCustomType: async (_: any, { options }: createCustomTypeOptions) => {
      const validationRes = await validateCreationQuery(options, "properties");
      if (validationRes.error) return validationRes.message;
      const { error, value } = typeSchema.validate(validationRes);
      if (error) {
        Logger.error(
          `FROM: EPB-server: Invalid resolver info received, aborting.. Error: ${error.message}`
        );
        return error.message;
      }
      try {
        Logger.http("FROM: EPB-server: Creating a new type interface...");
        const res = await create.createNewInterface({ options: options });
        Logger.http("FROM: EPB-server: Interface created successfully.");
        return "OK";
      } catch ({ message }) {
        Logger.error(`FROM: EPB-server: ${message}`);
        return "ERROR";
      }
    },
    // mutation-end
  },
};
