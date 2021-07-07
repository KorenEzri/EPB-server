import { createCustomTypeOptions } from "../../types";
import { createNewTypeDef } from "./createTypeDef";
import { promisify } from "util";
import Logger from "../../logger/logger";
import * as parseVars from "../utils/parse-vars";
import * as utils from "../utils";
import fs from "fs";
const write = promisify(fs.writeFile);

const toInterfaceString = (
  importStatements: string[],
  interfaceOpts: any,
  name: string
) => {
  const stringified = JSON.stringify(interfaceOpts, null, 2);
  const imports = importStatements.join("\n");
  const interfaceString = `// imports section \n\n${imports}//\n\n// imports section end\n\nexport interface ${name}Options ${stringified}\n// added at: ${new Date()} \n\n// exports section\n\n// exports section end`;
  let finishedInterface = utils.replaceAllInString(interfaceString, '"', "");
  finishedInterface = utils.replaceAllInString(finishedInterface, "||", "|");
  return finishedInterface;
};
// turn interface object to a stringified representation.

const fromOptionsToInterfaceString = ({ options }: createCustomTypeOptions) => {
  let interfaceOpts: any = { options: {} }; // this will be the interface as a string to write to a file
  const { properties, name } = options; // properties of the interface and it's name (ie const "name" = {...})
  const { importList, varList } = parseVars.parseInterfaceVarlist(properties);
  // importList = an array of import statements to add to the interface utils.
  // varList = an array of { name: string, type: string } to compose the interface object string.
  if (!Array.isArray(varList)) return; // always will be an array, this is for TS
  varList.forEach((variable) => {
    let type = variable.type;
    type = utils.removeLastWordFromString(type, ["Type", "Input"]);
    interfaceOpts.options[variable.name] = type; // assign names and types to interfaceOpts
  });
  const importStatements = utils.toImportStatements(importList);
  // turn an array of custom type names to an array of import statements
  return toInterfaceString(importStatements, interfaceOpts, name);
};
// turn options into an interface object like: fooOptions: {options: {...}}

const writeInterfaceToFiles = async (name: String, interfaceString: any) => {
  const typesPath = "./types";
  const interfaceName = `${name}Options`;
  const typeFilePath = `${typesPath}/${interfaceName}.ts`;
  const doesSchemaFileExist = await utils.checkIfFileAlreadyExists(
    "./db/schemas",
    typeFilePath
  );
  if (!doesSchemaFileExist) {
    await write(typeFilePath, interfaceString);
  } else {
    Logger.error(
      "FROM: EPB-server: Interface file already exists, aborting interface creation."
    );
  }
  const exportStatement = `export * from "./${name}Options"`;
  const res = await utils.addExportStatement(typesPath, exportStatement);
  await utils.alterConfigFile("add", "customTypes", interfaceName);
  return res;
};
// create a new interface file called fooOptions.ts inside ./types folder
// also adds export statement to ./types/index.ts

export const createNewInterface = async ({
  options,
}: createCustomTypeOptions) => {
  Logger.http("FROM: EPB-server: Creating a new type interface...");
  const interfaceString = fromOptionsToInterfaceString({ options: options });
  try {
    if (options.tsInterface !== "no") {
      await writeInterfaceToFiles(options.name, interfaceString);
      Logger.http(
        "FROM: EPB-server: Interface created successfully, applying Prettier."
      );
    }
    const { typeDef } = options;
    if (typeDef) {
      Logger.http("FROM: EPB-server: typeDef option received, creating..");
      const res = await createNewTypeDef({ options: options });
      return res || "OK";
    }
    await utils.applyPrettier();
    return "OK";
  } catch ({ message }) {
    return message;
  }
};
