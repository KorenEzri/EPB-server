import { GraphQLScalarType } from "graphql";

// TODO:
// CHECK BEST PRACTICE FOR WHERE TO STORE RESOLVER.TS AND TYPEDEF.TS
//  creating typeDef bugs: 1. typedef structure is nameOptions: { options: {}, kaki:string, ... }
// TODO:
//  - add prebuilt actions: {
//    - user auth - four days {
// -  TODO:
// -        - add option - i forgot what it was.. OH! add custom types to be available as return or receive types when creating interfaces
// -        - add auto export of schemas from index.ts of db schema folder.
// }
//    - CRUD operations for DB schema - four days
//    - Scalar type creator!! Then, add suppport for || in typedef creation as well.
// {
//////////// DUE: 01.07.21, Sunday. //////////////////
// TODO:
//  - code cleanup and tests
//  - add documentation, create a presentation
//////////// DUE: 05.07.21, Sunday. //////////////////

import {
  validateResolverCreation,
  validateTypeCreation,
  validateSchemaCreation,
} from "./validations";
// option types
import {
  addUserAuthOptions,
  ResolverOptions,
  createSchemaOptions,
  createCustomTypeOptions,
  stub,
} from "./types";
// option types end
import {
  getResolvers,
  getTypeDefs,
  getActions,
  getResolverNames,
} from "./utils/codeToString";
import * as utils from "./utils/utils";
import * as create from "./utils/create";
import * as add from "./utils/prebuiltActions";
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

    // Action: dadsadasdsadas
    getMessages: async (_: any) => {
      //
      // return [messageOptions]
    },

    // query-end
  },
  Mutation: {
    // Action: create a new resolver (empty)
    createResolver: async (_: any, { options }: ResolverOptions) => {
      const validationRes = await validateResolverCreation(options);
      if (validationRes.error) return validationRes.message;
      try {
        let error = await create.createNewTypeDef({ options: options });
        if (error && error !== "OK") return error;
        const resolverCreationRes = await create.createNewResolver({
          options: options,
        });
        setTimeout(async () => {
          await utils.restartServer();
        }, 1000);
        return resolverCreationRes;
      } catch ({ message }) {
        Logger.error(`FROM: EPB-server: ${message}`);
        return message;
      }
    },
    // Action: create a new type definition (singular)
    createCustomType: async (_: any, { options }: createCustomTypeOptions) => {
      const validationRes = await validateTypeCreation(options);
      if (validationRes.error) return validationRes.message;
      try {
        const interfaceCreationRes = await create.createNewInterface({
          options: options,
        });
        await utils.restartServer();
        return interfaceCreationRes;
      } catch ({ message }) {
        Logger.error(`FROM: EPB-server: ${message}`);
        return message;
      }
    },
    // Action: create a new database schema
    createSchema: async (_: any, { options }: createSchemaOptions) => {
      const validationRes = await validateSchemaCreation({ options: options });
      if (validationRes.error)
        return `Creation of DB schema failed: ${validationRes.message}`;
      try {
        const schemaCreationRes = await create.createDbSchema({
          options: options,
        });
        setTimeout(async () => {
          await utils.restartServer();
        }, 1000);
        return schemaCreationRes;
      } catch ({ message }) {
        Logger.error(`FROM: EPB-server: ${message}`);
        return message;
      }
    },

    // Action: Add prebuilt action: User Auth
    addUserAuth: async (_: any, { options }: addUserAuthOptions) => {
      const res = await add.addUserAuthToBackend({ options: options });
      if (res) return "OK";
      //
      // return String
    },

    // mutation-end
  },
};
