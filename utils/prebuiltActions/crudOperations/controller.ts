import { createResolverFromOpts } from "./mongodb/graphQL/resolvers";
import { createResolverOptions } from "../../../types";
import { availableCRUDActions } from "../../../consts";
import { getResolvers } from "../../codeToString";
import { mutationCRUDS } from "./mongodb/util";
import fs from "fs";
import { promisify } from "util";
import * as utils from "../../utils";
import Logger from "../../../logger/logger";
import { createTypedefFromOpts } from "./mongodb/graphQL/typeDefs";

const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

const createDBSchemaConfigList = async (schemaName: string) => {
  const ConfigListPath = `db/schemas/${schemaName}Config.ts`;
  const doesSchemaExist = await utils.checkIfFileAlreadyExists(
    "db/schemas",
    `${schemaName}`
  );
  if (!doesSchemaExist) {
    Logger.error(
      "FROM: EPB-server: Schema file could not be found, aborting CRUD configurations."
    );
    return;
  }
  const doesConfigListExist = await utils.checkIfFileAlreadyExists(
    "db/schemas",
    `${schemaName}Config`
  );
  if (!doesConfigListExist) {
    Logger.info(
      "FROM: EPB-server: Schema configuration file was not found. Creating a configuration .ts file.."
    );
    await write(ConfigListPath, availableCRUDActions);
    return ConfigListPath;
  } else return ConfigListPath;
};
//
const getDBSchemaConfigList = async (schemaName: string) => {
  const configFilepath = await createDBSchemaConfigList(schemaName);
  if (!configFilepath) return "Error: schema config file doesn't exist.";
  return await read(configFilepath, "utf8");
};
//
const validateCRUDopAvailability = async (
  schemaName: string,
  crudOps: string[]
) => {
  const availableCrudOperations = await getDBSchemaConfigList(schemaName);
  const availableCrudOpsLineArray = availableCrudOperations.toString();
  const errors: { error: boolean; message: string }[] = [];
  crudOps.forEach((crudOp: string) => {
    if (!availableCrudOpsLineArray.includes(crudOp)) {
      errors.push({
        error: true,
        message: `Crud operation ${crudOp} is not availabe for schema ${schemaName}.`,
      });
    }
  });
  if (errors.length) return errors;
};
//
const checkIfInterfaceExists = async (schemaName: string) => {
  const interfaceName = schemaName.split("Schema")[0];
  return await utils.checkIfFileAlreadyExists(
    "types",
    `${interfaceName}Options.ts`
  );
};
const removeCrudOpsFromAvailabilityList = async (
  schemaName: string,
  crudOps: string[]
) => {
  const listPath = `db/schemas/${schemaName}Config.ts`;
  let configList = utils.toLineArray(await read(listPath, "utf8"));
  crudOps.forEach((crud: string) => {
    configList = configList.filter((val: string) => !val.includes(crud));
  });
  await write(listPath, configList.join(""));
};
//
const insertModelImportStatementToResolverFile = async (modelName: string) => {
  try {
    let allResolversAsString = (await getResolvers()) || ""; // current resolver file as string
    if (!allResolversAsString)
      return "Error in utils/createNew/createResolver.ts: No resolvers found!";
    const startHandler = "// model imports";
    const endHandler = "// model imports end";
    await utils.insertStringToFileInRangeOfLines(
      "./resolvers.ts",
      utils.capitalizeFirstLetter(modelName),
      startHandler,
      endHandler
    );
  } catch ({ message }) {
    Logger.error(
      `FROM: EPB-server: Error with insertImportStatementToResolverFile() at utils/prebuiltActions/crudOperations/controller.ts ~line 64, ${message}`
    );
  }
};
const insertOptionsInterfaceImportToResolverFile = async (
  optionsName: string
) => {
  try {
    let allResolversAsString = (await getResolvers()) || ""; // current resolver file as string
    if (!allResolversAsString)
      return "Error in utils/createNew/createResolver.ts: No resolvers found!";
    const startHandler = "// option types";
    const endHandler = "// option types end";
    await utils.insertStringToFileInRangeOfLines(
      "./resolvers.ts",
      `${optionsName},`,
      startHandler,
      endHandler
    );
  } catch ({ message }) {
    Logger.error(
      `FROM: EPB-server: Error with insertImportStatementToResolverFile() at utils/prebuiltActions/crudOperations/controller.ts ~line 64, ${message}`
    );
  }
};
//
const createCrudOps = async (
  schemaName: string,
  crudOps: string[],
  identifier: { name: string; type: string }
) => {
  crudOps = crudOps.map((op: string) => op.split(" ").join(""));
  for (let i = 0; i < crudOps.length; i++) {
    const crudOperation = crudOps[i];
    const resolverType = mutationCRUDS.includes(crudOperation)
      ? "Mutation"
      : "Query";
    const options: createResolverOptions = {
      Model: schemaName,
      action: crudOperation,
      resolverType,
      identifier,
    };
    await createResolverFromOpts(options);
    await createTypedefFromOpts(options);
    Logger.http(
      `FROM: EPB-server: created CRUD action ${crudOperation}, applying Prettier..`
    );
    // await utils.applyPrettier();
  }
};
//
//
//
export const addCrudToDBSchemas = async (
  schemaName: string,
  crudOperations: string[],
  identifier: { name: string; type: string }
) => {
  const doesInterfaceExist = await checkIfInterfaceExists(schemaName);
  if (!doesInterfaceExist)
    return {
      error: true,
      message: `An interface for the schema ${schemaName} doesn't exist. Please create one first.`,
    };
  await createDBSchemaConfigList(schemaName); // checks if a config file exists, if it doesn't, it creates one.
  const availabilityErrors = await validateCRUDopAvailability(
    // makes sure the received CRUD operations are viable for the schema.
    schemaName,
    crudOperations
  );
  if (availabilityErrors) return availabilityErrors; // if some operations are invalid, returns an array of errors.
  const schemaNameOnly = utils.replaceAllInString(schemaName, "Schema", "");
  const modelName = `${schemaNameOnly}Model`;
  const optionsName = `${utils.lowercaseFirstLetter(schemaNameOnly)}Options`;
  Logger.http(`FROM: EPB-server: Inserting import statements...`);
  await insertModelImportStatementToResolverFile(modelName);
  await insertOptionsInterfaceImportToResolverFile(optionsName);
  Logger.http(
    `FROM: EPB-server: Creating ${crudOperations.length} CRUD operations..`
  );
  await createCrudOps(schemaName, crudOperations, identifier);
  await removeCrudOpsFromAvailabilityList(schemaName, crudOperations);
  Logger.http(`FROM: EPB-server: Finished.`);
  return "OK";
};
