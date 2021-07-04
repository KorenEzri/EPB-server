export interface addCrudOperationsOptions {
  options: {
    schemaName: string;
    crudActions: string[];
    identifier: { name: string; type: string };
  };
}
