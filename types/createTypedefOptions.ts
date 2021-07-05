export interface createTypedefOptions {
  options: {
    properties: string[];
    name: string;
    comment: string;
    dbSchema: boolean;
    typeDef: boolean;
    returnType?: string;
    type?: string;
    tsInterface?: string;
    actionName?: string;
  };
}
// added at: Sun Jun 20 2021 15:26:15 GMT+0300 (Israel Daylight Time)
