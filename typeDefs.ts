const { gql } = require("apollo-server-express");
export const typeDefs = gql`
  scalar Date
  # generated definitions

  input createCustomTypeOptions {
    vars: [String]
    name: String
    type: String
  }
  # added at: Sun Jun 20 2021 15:26:15 GMT+0300 (Israel Daylight Time)

  # generated definitions end
  input ResolverOptions {
    name: String
    comment: String
    resolver: String
    returnType: String
    type: String
    vars: [String]
    description: String
  }
  type Query {
    getResolvers: String
    getTypeDefs: String
    getActions: [String]

    # query-end
  }
  type Mutation {
    createResolver(options: ResolverOptions): String
    createCustomType(options: createCustomTypeOptions): String

    # mutation-end
  }
`;
