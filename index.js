const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { getUser } = require('./utils/userUtils');
const mongoose = require('mongoose');
const models = require("./models/schema");
const resolvers = require('./graphql/resolvers');
const { movieTypeDefs } = require("./graphql/typeDefs/movie.graphql");
const { userTypeDefs } = require("./graphql/typeDefs/user.graphql");
const { shield, rule, allow } = require('graphql-shield');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { applyMiddleware } = require("graphql-middleware");

require('dotenv').config();

// common auth setup for all queries and mutations
const isAuthenticated = rule()((_, __, { user }) => {
  return user != null;
});

const schema = makeExecutableSchema({
  typeDefs: [movieTypeDefs, userTypeDefs],
  resolvers
});

const permissions = shield({
  Query: {
    movies: isAuthenticated,
    movie: allow,
  },
  Mutation: {
    register: allow,
    login: allow,
    '*': isAuthenticated,
  }
}, {
  allowExternalErrors: true
});

const securedSchema = applyMiddleware(schema, permissions);

async function startServer() {
  const server = new ApolloServer({
    schema: securedSchema,
    formatError: (error) => {
      return {
        message: error.message,
        status: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      };
    },
  });

  try {
    await mongoose.connect('mongodb://localhost:27017/STEP');
    console.log('Database Connected');

    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        const user = getUser(token);
        return { user, ...models };
      },
      listen: { port: process.env.PORT },
    });
    console.log(`Our graphql server is ⬆️ and 🏃‍♂️ in ${url}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();