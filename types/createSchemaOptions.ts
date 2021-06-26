export interface createSchemaOptions {
  options: {
    properties: [string] | string[];
    name: string;
    comment: string;
    typeDef: boolean;
    dbSchema: boolean;
    type: string;
    uniqueIdentifiers: [string] | string[];
  };
}
// added at: Tue Jun 22 2021 09:40:13 GMT+0300 (Israel Daylight Time)
