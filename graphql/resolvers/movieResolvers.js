const { ERROR_MESSAGES } = require('../../constants/constants');
const { GraphQLError } = require('graphql');

const movieResolvers = {
  Query: {
    movies: async (_, { genre }, { Movies }) => {
      try {
        let movies = [];
        movies = genre? await Movies.find({ genre }): await Movies.find();
        return movies;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    movie: async (_, { movieId }, { Movies }) => {
      try {
        const movie = await Movies.findOne({ movieId });
        return movie;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },

  Mutation: {
    createMovie: async (_, { input }, { Movies }) => {
      try {
        const movieExists = await Movies.findOne({ movieName: input.movieName });
        if (movieExists) {
          throw new GraphQLError(ERROR_MESSAGES.MOVIE_EXIST.MESSAGE);
        }
        const currMoviesLength = await Movies.countDocuments();
        input.movieId = currMoviesLength + 1;
        return await Movies.create(input);
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    updateMovie: async (_, { input }, { Movies }) => {
      try {
        const updatedMovie = await Movies.findOneAndUpdate(
          { movieId: input.movieId },
          { $set: input },
          { new: true }
        );
        return updatedMovie;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    deleteMovie: async (_, { movieId }, { Movies }) => {
      try {
        const result = await Movies.findOneAndDelete({ movieId });
        return result;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

module.exports = movieResolvers;