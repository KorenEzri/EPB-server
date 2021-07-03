import { typeDefs } from "../typeDefs";
export const allCustomTypes = typeDefs.definitions.map(
  (definition: any) => definition.name.value
);
export const validResolverTypes = ["Query", "Mutation"];
const customTypesAsGQLArrays = allCustomTypes.map((type: string) => {
  return `[${type}]`;
});
const customTypesAsTSArrays = allCustomTypes.map((type: string) => {
  return `${type}[]`;
});
export const allCustomTypesWithArrayTypes = customTypesAsTSArrays
  .concat(customTypesAsGQLArrays)
  .concat(allCustomTypes);
export const validTypes = [
  "string",
  "string[]",
  "String",
  "String[]",
  "number",
  "number[]",
  "Number",
  "Number[]",
  "boolean",
  "boolean[]",
  "Boolean",
  "Boolean[]",
  "date",
  "date[]",
  "Date",
  "Date[]",
  "[string]",
  "[String]",
  "[number]",
  "[Number]",
  "[boolean]",
  "[Boolean]",
  "[date]",
  "[Date]",
  "int",
  "int[]",
  "Int",
  "Int[]",
  "[int]",
  "[Int]",
].concat(allCustomTypesWithArrayTypes);

export const availableCRUDActions = `const availableCRUDActions = [
    "Create One",
    "Create Many",
    "Read One",
   "Read Many",
    "Read All",
    "Update One",
    "Update Many",
    "Delete One",
    "Delete Many",
]`;
