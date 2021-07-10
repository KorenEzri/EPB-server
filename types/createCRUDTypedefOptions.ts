export interface createTypeDefOptions {
  action: string;
  Model: string;
}
export interface typeDefTitleOptions {
  type: string;
  name: string;
}
export interface typeDefVariableListOptions {
  varListString: string;
}
export interface typeDefQueryMutationDefinitionsOptions {}
export interface revampedOptions {
  properties?:
    | { name: string; type: string }[]
    | { name: string; type: string };
  names?: {
    schemaName: string;
    modelName: string;
    customTypeName: string;
    actionName?: string;
    typeDefInterfaceName?: string;
  };
  comment?: string;
  dbSchema?: boolean;
  typeDef?: boolean;
  returnType?: string;
  type?: string;
  interfacePrefix?: string;
  propertiesForTypeInterface?:
    | { name: string; type: string }[]
    | { name: string; type: string };
}
export interface optionsFromInterfaceFile {
  modelName: string;
  action: string;
  resolverType: string;
  identifier: { name: string; type: string };
}
export type propertiesForInterfaceVariables =
  | { name: string; type: string }[]
  | { name: string; type: string }
  | undefined;
export type Names =
  | {
      schemaName: string;
      modelName: string;
      customTypeName: string;
      actionName?: string | undefined;
      typeDefInterfaceName?: string | undefined;
    }
  | undefined;
export interface optionsFromClient {
  properties: string[];
  name: string;
  comment: string;
  dbSchema?: boolean;
  typeDef?: boolean;
  returnType?: string;
  type?: string;
  actionName?: string;
  propertiesForTypeInterface?: string[];
}
export type varList = { name: string; type: string }[];
export interface arrangeSchemaConfigFileVars {
  inputAndType: boolean;
  typeDefInterfaceTypeName: string;
  typeDefInterfaceLength: number;
  names: Names;
  typeDefAction: string | undefined;
}
