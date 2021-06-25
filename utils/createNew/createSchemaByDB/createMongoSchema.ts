import { createSchemaOptions } from "../../../types";
import { imports } from "../../../consts/imports";
import * as utils from "../string.util";
import { promisify } from "util";
import fs from "fs";
import { createNewInterface, insert_Into_Types_Index_TS } from "../";
import Logger from "../../../logger/logger";
import { checkIfOK } from "../../codeToString";
const write = promisify(fs.writeFile);
const read = promisify(fs.readFile);

const addUniqueVariant = (type: string) => {
  const uniqueVarString = `
        { type: ${type}, unique: true }
    `;
  return utils.replaceAllInString(uniqueVarString, "\n", "");
};
const arrangeOrOperatorTypes = (variable: { var: string; type: string }) => {
  let varType = variable.type;
  if (varType.split("[").length > 1 && varType.split("|").length <= 1) {
    variable.type = "Array";
    return variable;
  }
  if (varType.split("|").length <= 1) return variable;
  varType = utils.replaceAllInString(varType, "||", "|");
  const splat = varType.split("|");
  let varTypeA = utils
    .capitalizeFirstLetter(utils.replaceAllInString(splat[0], "|", ""))
    .trim();
  let varTypeB = utils.capitalizeFirstLetter(
    utils.replaceAllInString(splat[1], "|", "").trim()
  );
  if (varTypeA.split("[").length > 1) {
    varTypeA = "Array";
  }
  if (varTypeB.split("[").length > 1) {
    varTypeB = "Array";
  }
  variable.type = `${utils.capitalizeFirstLetter(
    varTypeA
  )} || ${utils.capitalizeFirstLetter(varTypeB)}`;
  return variable;
};
const checkIfUniqueVar = (varb: string, uniqueList: string[]) => {
  return uniqueList
    .map((variable) => variable.split(":")[0].toLowerCase())
    .includes(varb);
};
const compileSchemaVarList = (
  properties: string[],
  uniqueIdentifiers: string[]
) => {
  const schemaInterface: any = {};
  let varList = utils.compileToVarList(properties);
  varList.forEach((variable) => {
    let lowerCaseType = utils.fixTypes(variable);
    variable.type = lowerCaseType;
    variable = arrangeOrOperatorTypes(variable);
  });
  varList.forEach((variable) => {
    const lowerCaseType = variable.type;
    const finishedType = utils.capitalizeFirstLetter(lowerCaseType.trim());
    schemaInterface[variable.var] = finishedType;
    if (checkIfUniqueVar(variable.var, uniqueIdentifiers)) {
      schemaInterface[variable.var] = addUniqueVariant(finishedType);
    }
  });
  const stringified = JSON.stringify(schemaInterface, null, 2);
  return utils.replaceAllInString(stringified, '"', "");
};
const toMongoSchema = (options: createSchemaOptions) => {
  const { properties, name, comment, type, uniqueIdentifiers } =
    options.options;
  const mongoImportsList = imports.statements.db.mongodb;
  const schemaInterface = compileSchemaVarList(properties, uniqueIdentifiers);
  if (uniqueIdentifiers.length)
    mongoImportsList.push(
      "import uniqueValidator from 'mongoose-unique-validator';"
    );
  mongoImportsList.push(`import {${name}Doc} from "../../types";`);
  const schema = `
        ${mongoImportsList.join("")}
        const ${name}Schema: Schema = new mongoose.Schema(${schemaInterface})
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
  return schema;
};
const updateInterfaceFile = async ({ options }: createSchemaOptions) => {
  const interfaceFilePath = `./types/${options.name}Options.ts`;
  const interfaceFile = await read(interfaceFilePath, "utf8");
  const splat = interfaceFile.split("\n");
  const importStartIndex = splat.indexOf("// imports section") + 1;
  const importEndIndex = splat.indexOf("// imports section end");
  splat.splice(
    importStartIndex,
    importEndIndex - importStartIndex,
    "import { Document } from 'mongoose'"
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
const handleInterface = async ({ options }: createSchemaOptions) => {
  const interfaceFilePath = `./types/${options.name}Options.ts`;
  const doesInterfaceFileExist = await checkIfOK(interfaceFilePath);
  if (doesInterfaceFileExist) {
    Logger.http("FROM: EPB-server: Updating an existing interface file..");
    await updateInterfaceFile({ options: options });
  } else if (!doesInterfaceFileExist) {
    Logger.http("FROM: EPB-server: Creating a new interface file..");
    await createNewInterface({ options: options });
    await updateInterfaceFile({ options: options });
  } else {
    const msg =
      "FROM: EPB-server: Failed to detect interface file, yet it seems an import to it in ./types/index.ts exists. Aborting.";
    Logger.error(msg);
    return msg;
  }
};
const writeSchemaToFile = async (name: string, schema: string) => {
  const schemaFilepath = `./db/schemas/${name}Schema.ts`;
  const doesSchemaFileExist = await checkIfOK(schemaFilepath);
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
  error = await handleInterface({ options: options });
  if (error) return error;
  Logger.http("FROM: EPB-server: Done, applying prettier for files.");
  await utils.applyPrettier("./db/schemas/*.ts");
  return "Schema created successfully.";
};

//// FIX '[' parsing in dbSchema creation
/// FIX : || operator parsing - add uppercase to right hand side of || operator.
