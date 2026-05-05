/**
 * Standard API response envelope
 */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, pagination = null }) => {
    const response = { success: true, message, data };
    if (pagination) response.pagination = pagination;
    return res.status(statusCode).json(response);
};

export const sendError = (res, { statusCode = 500, message = 'Internal server error', errors = null }) => {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
};

export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
