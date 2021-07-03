import * as mongoUtils from "../util";
import * as utils from "../../../../utils";
import { promisify } from "util";
import fs from "fs";
const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);

export const createOneTypeDef = async (Model: string) => {
  const modelNameOnly = utils.replaceAllInString(Model, "Model", "");
  const modelPath = `types/${modelNameOnly}Options.ts`;
  const modelOptions = await read(modelPath);
  const typeDef = `input ${modelNameOnly}Input {
        ${modelOptions}
    }`;
  const startHandler = "# generated definitions";
  const endHandler = "# generated definitions end";
  await utils.insertStringToFileInRangeOfLines(
    "typeDefs.ts",
    typeDef,
    startHandler,
    endHandler
  );
};
