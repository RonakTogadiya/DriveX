/**
 * Global Error Handler Middleware
 * Catches errors passed via next(err) from any route or controller.
 * Returns a consistent JSON error response.
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose: Bad ObjectId (e.g., /api/listings/not-a-valid-id)
    if (err.name === 'CastError') {
        message = `Resource not found with id: ${err.value}`;
        statusCode = 404;
    }

    // Mongoose: Duplicate key (e.g., duplicate email or username)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate field value: '${err.keyValue[field]}'. A record with this ${field} already exists.`;
        statusCode = 400;
    }

    // Mongoose: Validation errors
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please log in again.';
        statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        message = 'Your token has expired. Please log in again.';
        statusCode = 401;
    }

    res.status(statusCode).json({
        success: false,
        message,
        // Only show stack trace in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorHandler;
