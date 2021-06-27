import { createSchemaOptions } from "../../../types";
import { createNewInterface } from "../../create";
import { imports } from "../../../consts/imports";
import Logger from "../../../logger/logger";
import * as utils from "../../utils";
import { promisify } from "util";
import fs from "fs";
const write = promisify(fs.writeFile);

const toMongoSchema = (options: createSchemaOptions) => {
  const { properties, name, comment, uniqueIdentifiers } = options.options;
  const mongoImportsList = imports.statements.db.mongodb;
  const { schemaInterface } = utils.parseMongoVarlist(
    properties,
    uniqueIdentifiers
  );
  const stringifiedMongoInterface = JSON.stringify(schemaInterface, null, 2);
  if (uniqueIdentifiers.length)
    mongoImportsList.push(
      "import uniqueValidator from 'mongoose-unique-validator';"
    );
  mongoImportsList.push(`import {${name}Doc} from '../../types';`);
  const schema = `
        ${mongoImportsList.join("")}
        const ${name}Schema: Schema = new mongoose.Schema(${stringifiedMongoInterface})
        ${
          uniqueIdentifiers.length
            ? `${name}Schema.plugin(uniqueValidator)`
            : ""
        }
        ${name}Schema.set('toJSON', {
            transform: (_: any, returnedObject: any) => {
                delete returnedObject.__v;
            }
        })
        export const ${name}Model = mongoose.model<${name}Doc>('${name}Model', ${name}Schema)
        // ${comment}
`;
  return utils.replaceAllInString(schema, '"', "");
};
const writeSchemaToFile = async (name: string, schema: string) => {
  const schemaFilepath = `./db/schemas/${name}Schema.ts`;
  const doesSchemaFileExist = await utils.checkIfFileAlreadyExists(
    "./db/schemas",
    schemaFilepath
  );
  if (!doesSchemaFileExist) {
    await write(schemaFilepath, schema);
  } else {
    Logger.error(
      `FROM: EPB-server: Error: Schema file by the name ${name}Schema.ts already exists!`
    );
    return "Schema file already exists!";
  }
};
export const createMongoDBSchema = async ({ options }: createSchemaOptions) => {
  Logger.http("FROM: EPB-server: Creating a MongoDB schema...");
  const mongoDBSchema = toMongoSchema({ options: options });
  Logger.http("FROM: EPB-server: Schema created, applying...");
  let error = await writeSchemaToFile(options.name, mongoDBSchema);
  if (error) return error;
  Logger.http("FROM: EPB-server: Done, applying prettier for files.");
  await utils.applyPrettier("./db/schemas/*.ts");
  return "Schema created successfully.";
};
