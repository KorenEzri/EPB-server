const { gql } = require("apollo-server-express");
export const typeDefs = gql`
  scalar Date
  # generated definitions

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

    # mutation-end
  }
`;
