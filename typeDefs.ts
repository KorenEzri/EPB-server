const { gql } = require("apollo-server-express");
export const typeDefs = gql`
  type Query {
    What: String
    Why: String
  }
  type Mutation {
    How: String
  }
`;
