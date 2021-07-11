import { GraphQLScalarType } from "graphql";
import {
  validateResolverCreation,
  validateTypeCreation,
  validateSchemaCreation,
} from "./validations";
// generated imports

//

// option types
import {
  addUserAuthOptions,
  ResolverOptions,
  createSchemaOptions,
  addCrudOperationsOptions,
  createCustomTypeOptions,
  stub,
} from "./types";
// option types end
// model imports
import { modelstub } from "./db/schemas";
// model imports end
import {
  getResolvers,
  getTypeDefs,
  getActions,
  getResolverNames,
} from "./createBackendFunctions/codeToString";
import * as utils from "./createBackendFunctions/utils";
import * as create from "./createBackendFunctions/create";
import * as add from "./createBackendFunctions/prebuiltActions";
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

    // Action: get all the properties of a schema, provided it's name.

    getAllSchemaProps: async (
      _: any,
      { schemaName }: { schemaName: string }
    ) => {
      return await utils.getAllSchemaProps(schemaName);
      // return [String]
    },

    // Action: get allowed CRUD operations for schema

    getAllowedCruds: async (_: any, { schemaName }: { schemaName: string }) => {
      return await utils.readFromSchemaConfigFile(schemaName);
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
    restartServer: async (_: any, { timeout }: { timeout: number }) => {
      Logger.info(
        `FROM: EPB-server: Restarting server in ${timeout} miliseconds..`
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
        if (Array.isArray(res)) {
          res.forEach((error) => {
            Logger.error(`FROM: EPB-server: ${error.message}`);
          });
          return `${res.length} out of ${crudActions.length} CRUD operations could not be created for DB schema ${schemaName}!`;
        } else if (!res.error) {
          return `${crudActions.length} crud operation(s) created successfully.`;
        } else {
          return `${res.message}`;
        }
      } catch ({ message }) {
        Logger.error(message);
        return message;
      }
    },

    // mutation-end
  },
};
