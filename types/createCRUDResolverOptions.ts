export interface createResolverOptions {
  Model: string;
  action: string;
  resolverType: string;
  identifier: { name: string; type: string };
}
export interface resolverTryCatchBlockOptions {
  modelInstaceName: string | undefined;
  mongoDBModelObjectName: string | undefined;
  modelFunctionVarName: string | undefined;
  mongooseMethod?: string;
  identifier?: { name: string; type: string };
}
export interface resolverBodyOptions {
  modelInstaceName: string | undefined;
  mongoDBModelObjectName: string | undefined;
  modelFunctionVarName: string | undefined;
  resolverTryCatchBlock: string | undefined;
  mongooseMethod?: string;
  identifier?: { name: string; type: string };
}
export interface resolverTitleOptions {
  resolverName: string;
  modelFunctionVarName: string;
  modelInterfaceName: string;
  identifier?: { name: string; type: string };
}
