import { GraphQLScalarType } from "graphql";

/*
TODO:
CRUD
- Add "Select all" button when choosing CRUD actions
DUE: 4.07.21, Saturday night.

CHAT APP PRESENTATION
- Make a 100% working chatapp presentation
- CHECK BEST PRACTICE FOR WHERE TO STORE RESOLVER.TS AND TYPEDEF.TS
DUE: 8.07.21, Thursday morning.

PRESENTATION
- Make a presentation to depict the project
- Add documentation to your Github repo.
DUE: 9.07.21, Friday night.

AUTH
- Add complete user auth system with the click of a button - will include:
- public user schema
- auth user schema
four GQLtypes - input and type for user, input and type for auth
CRUD operations for both schemas:
- create - with hashing of passwords and saving them in a DB
- delete - to delete
- read - to get the user
- login - to log in with password.
- cookies on backend.
DUE: 12.07.21, Monday morning.

//  - add more options to the CLI - make it customizable
//  - make sure creating only a DB schema works
*/
//////////// DUE: 13.07.21, Sunday. //////////////////

import {
  validateResolverCreation,
  validateTypeCreation,
  validateSchemaCreation,
} from "./validations";
// option types
import {
  messageOptions,
  addUserAuthOptions,
  ResolverOptions,
  createSchemaOptions,
  createCustomTypeOptions,
  stub,
} from "./types";
// option types end
// model imports
import { modelstub, MessageModel } from "./db/schemas";
// model imports end
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

interface addCrudOperationsOptions {
  options: {
    schemaName: string;
    crudActions: string[];
    identifier: { name: string; value: any };
  };
}

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

    // Action: get a list of all allowed input and return types
    getAllowedTypes: async (_: any) => {
      return utils.getAllAllowedTypes();
    },

    // Action: get a list of all database schemas.
    getAllDBSchemaNames: async (_: any) => {
      // await add.createDBSchemaConfigList("messageSchema");
      return await utils.getAllSchemaNames();

      // return [String]
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

    // Action: Restart the server
    restartServer: async (_: any, timeout: number) => {
      Logger.info(
        `FROM: EPB-server: Restarting server in ${timeout} miliseconds.`
      );
      setTimeout(async () => {
        await utils.restartServer();
      }, timeout);
    },

    // Action: add prebuilt action: Crud Operations
    addCrudOperations: async (
      _: any,
      { options }: addCrudOperationsOptions
    ) => {
      const { schemaName, crudActions, identifier } = options;
      try {
        const res = await add.addCrudToDBSchemas(
          schemaName,
          crudActions,
          identifier
        );
        if (!Array.isArray(res)) return "OK";
        res.forEach((error) => {
          Logger.error(`FROM: EPB-server: ${error.message}`);
        });
        return `${res.length} out of ${crudActions.length} CRUD operations could not be created for DB schema ${schemaName}!`;
      } catch ({ message }) {
        Logger.error(message);
      }
    },

    // mutation-end
  },
};
