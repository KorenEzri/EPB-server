import { typeDefs } from "../typeDefs";
export const allCustomTypes = typeDefs.definitions.map(
  (definition: any) => definition.name.value
);
export const validResolverTypes = ["Query", "Mutation"];
export const validTypes = [
  "string",
  "String",
  "number",
  "Number",
  "boolean",
  "Boolean",
  "date",
  "Date",
  "[string]",
  "[String]",
  "[number]",
  "[Number]",
  "[boolean]",
  "[Boolean]",
  "[date]",
  "[Date]",
  "int",
  "Int",
  "[int]",
  "[Int]",
].concat(allCustomTypes);
