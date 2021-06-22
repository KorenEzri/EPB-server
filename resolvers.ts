import { GraphQLScalarType } from "graphql";
import execa from "execa";

// TODO: 22/06/21
//  - add support for || in type system
//  - add support for multiple unique identifiers in DB schema
//  - add backend validations for DB schema creation (make it flexy!!!!)
//  - add singular DB schema creation
//  - finish adding DB schemas
//  - code cleanup
//////////// DUE: 23.06.21, Sunday. //////////////////
// TODO:
//  - add prebuilt actions: {
//    - user auth - four days
//    - CRUD operations for DB schema - four days
// {
//////////// DUE: 01.07.21, Sunday. //////////////////
// TODO:
//  - code cleanup and tests
//  - add documentation, create a presentation
//////////// DUE: 05.07.21, Sunday. //////////////////

import { validateCreationQuery } from "./validations";
// option types
import {
  ResolverOptions,
  createSchemaOptions,
  createCustomTypeOptions,
  stub,
} from "./types";
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
      try {
        let res = await create.createNewTypeDef({ options: options });
        if (!res) res = await create.createNewResolver({ options: options });
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
      try {
        await create.createNewInterface({ options: options });
        return "OK";
      } catch ({ message }) {
        Logger.error(`FROM: EPB-server: ${message}`);
        return "ERROR";
      }
    },
    // Action: create a new database schema
    createSchema: async (_: any, { options }: createSchemaOptions) => {
      const validationRes = await validateCreationQuery(options, "properties");
      if (validationRes.error) return validationRes.message;
      try {
        await create.createDbSchema({ options: options });
        return "OK";
      } catch ({ message }) {
        Logger.error(`FROM: EPB-server: ${message}`);
        return "ERROR";
      }
    },
    // mutation-end
  },
};
