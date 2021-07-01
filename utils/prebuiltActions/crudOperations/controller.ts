import { avalableCRUDActions } from "../../../consts";
import { getResolvers } from "../../codeToString";
import Logger from "../../../logger/logger";
import * as utils from "../../utils";
import fs from "fs";
import { promisify } from "util";
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
    await write(ConfigListPath, avalableCRUDActions);
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
  const availableCrudOpsLineArray = JSON.parse(availableCrudOperations);
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
const removeCrudOpsFromAvailabilityList = async (
  schemaName: string,
  crudOps: string[]
) => {};
//
const insertImportStatementToResolverFile = async (modelName: string) => {
  try {
    let allResolversAsString = (await getResolvers()) || ""; // current resolver file as string
    if (!allResolversAsString)
      return "Error in utils/createNew/createResolver.ts: No resolvers found!";
    const insertImportStatementRes = utils.insertImportStatement(
      allResolversAsString,
      modelName
    );
    await write("./resolvers.ts", insertImportStatementRes);
  } catch ({ message }) {
    Logger.error(
      `FROM: EPB-server: Error with insertImportStatementToResolverFile() at utils/prebuiltActions/crudOperations/controller.ts ~line 64, `,
      message
    );
  }
};
//
const createCrudOps = async (schemaName: string, crudOps: string[]) => {};
//
export const addCrudToDBSchemas = async (
  schemaName: string,
  crudOperations: string[]
) => {
  await createDBSchemaConfigList(schemaName); // checks if a config file exists, if it doesn't, it creates one.
  const availabilityErrors = await validateCRUDopAvailability(
    // makes sure the received CRUD operations are viable for the schema.
    schemaName,
    crudOperations
  );
  if (availabilityErrors) return availabilityErrors; // if some are invalid, returns an array of errors.
  await createCrudOps(schemaName, crudOperations);
  await removeCrudOpsFromAvailabilityList(schemaName, crudOperations);
  return "OK";
};
const generate = async (modelName: string) => {
  const modelImport = `db/schemas/${modelName}.ts`;
  await insertImportStatementToResolverFile(modelName);
};
