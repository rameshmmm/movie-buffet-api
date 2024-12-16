const { GraphQLError } = require('graphql');
const jwt = require('jsonwebtoken');
const { ERROR_MESSAGES } = require('../../constants/constants');
const { encryptPassword, decryptPassword } = require('../../utils/dataEncryptionUtils');

const userResolvers = {
  Mutation: {
    login: async (_, { input }, { Users } ) => {
      try {
        const user = await Users.findById(input.userId);
        if (!user) {
          throw new GraphQLError('User Not Found!');
        }

        const isValidPassword = decryptPassword(input.password, user.password);
        if (!isValidPassword) {
          throw new GraphQLError('Incorrect Password!');
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
          expiresIn: '3000s',
        });
        return token;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    register: async (_, { input }, { Users }) => {
      try {
        const { userName, password } = input;

        // Check if userName already exists
        const existingUser = await Users.findOne({ userName });
        if (existingUser) {
          throw new GraphQLError(ERROR_MESSAGES.USER_EXIST.MESSAGE);
        }

        // Encrypt the password
        const hashedPassword = encryptPassword(password);

        // Create and save the new user
        const newUser = await Users.create({
          userName,
          password: hashedPassword,
        });

        return {
          userId: newUser._id,
          userName: newUser.userName,
        };
      } catch (error) {
        throw new GraphQLError(error.message || 'Failed to register user');
      }
    },
  },
};

module.exports = userResolvers;