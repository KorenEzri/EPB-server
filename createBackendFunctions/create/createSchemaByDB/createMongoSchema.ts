import { createSchemaOptions } from "../../../types";
import { imports } from "../../../consts/imports";
import Logger from "../../../logger/logger";
import * as utils from "../../utils";
import * as parseVars from "../../utils/parse-vars";
import { promisify } from "util";
import fs from "fs";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

const updateInterfaceFile = async ({ options }: createSchemaOptions) => {
  const interfaceFilePath = `./types/${options.name}Options.ts`;
  const interfaceFile = await read(interfaceFilePath, "utf8");
  const splat = interfaceFile.split("\n");
  const importStartIndex = splat.indexOf("// imports section") + 1;
  const importEndIndex = splat.indexOf("// imports section end");
  const imports = splat.slice(importStartIndex, importEndIndex - 1);
  imports.push("import { Document } from 'mongoose'");
  splat.splice(
    importStartIndex,
    importEndIndex - importStartIndex,
    imports.join("\n")
  );
  const exportStartIndex = splat.indexOf("// exports section") + 1;
  const exportEndIndex = splat.indexOf("// exports section end");
  splat.splice(
    exportStartIndex,
    exportEndIndex - exportStartIndex,
    `export interface ${options.name}Doc extends Document, ${options.name}Options {}`
  );
  await write(interfaceFilePath, splat.join("\n"));
};
const toMongoSchema = (options: createSchemaOptions) => {
  const { properties, name, comment, uniqueIdentifiers } = options.options;
  const mongoImportsList = imports.statements.db.mongodb;
  const { schemaInterface } = parseVars.parseMongoVarlist(
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
        export const ${utils.capitalizeFirstLetter(
          name
        )}Model = mongoose.model<${name}Doc>('${utils.capitalizeFirstLetter(
    name
  )}Model', ${name}Schema)
        // ${comment}
`;
  return utils.replaceAllInString(schema, '"', "");
};
const writeSchemaToFile = async (name: string, schema: string) => {
  const schemaFilepath = `./db/schemas/${name}Schema.ts`;
  const doesSchemaFileExist = await utils.checkIfFileAlreadyExists(
    "./db/schemas",
    `${name}Schema.ts`
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
  // await createNewInterface({ options: options });
  const mongoDBSchema = toMongoSchema({ options: options });
  const schemaName = `${options.name}Schema`;
  Logger.http(
    "FROM: EPB-server: Schema created, updating interface file to include a mongo document export..."
  );
  try {
    await updateInterfaceFile({ options: options });
  } catch ({ message }) {
    Logger.debug(
      "FROM: EPB_server: Failed to add a document export to interface file - possibly because the file doesn't exist."
    );
  }
  let error = await writeSchemaToFile(options.name, mongoDBSchema);
  if (error) return error;
  Logger.http(
    "FROM: EPB-server: Add a model export statement to db/schemas/index.ts.."
  );
  await utils.addExportStatement(
    "db/schemas",
    `export * from "./${schemaName}"`
  );
  await utils.alterConfigFile("add", "dbSchemas", schemaName);
  Logger.http("FROM: EPB-server: Done, applying prettier for files.");
  await utils.applyPrettier("./db/schemas/*.ts");
  return "Schema created successfully.";
};
