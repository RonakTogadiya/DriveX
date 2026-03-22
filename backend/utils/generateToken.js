const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for a given user ID.
 * @param {string} id - The MongoDB ObjectId of the user.
 * @returns {string} The signed JWT string.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d', // Token expires in 7 days
    });
};

module.exports = generateToken;
