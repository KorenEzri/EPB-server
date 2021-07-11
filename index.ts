require("dotenv").config();
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import express from "express";
import Logger from "./logger/logger";

const PORT = process.env.PORT || 8001;

const startServer = async () => {
  const app = express();
  const server = new ApolloServer({
    context: ({ req, res }) => ({ req, res }),
    playground: {
      settings: {
        "request.credentials": "include",
      },
    },
    resolvers: resolvers,
    typeDefs: typeDefs,
  });
  server.applyMiddleware({ app });
  app.listen({ port: PORT }, () =>
    Logger.info(`
    EPB-server @ 
    http://localhost:${PORT}${server.graphqlPath}
    `)
  );
};

startServer();
