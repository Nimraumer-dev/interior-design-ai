const mongoose = require('mongoose');
const multer = require('multer');
const { ZodError } = require('zod');

function notFound(req, res, next) {
  const error = new Error('Route not found.');
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = status >= 500 ? 'An unexpected server error occurred.' : error.message;

  if (error instanceof ZodError) {
    status = 400;
    code = 'INVALID_INPUT';
    message = error.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join('; ');
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = error.code === 'LIMIT_FILE_SIZE' ? 'UPLOAD_TOO_LARGE' : 'INVALID_UPLOAD';
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Image must be no larger than 10 MB.'
      : 'Upload exactly one image file in the image field.';
  } else if (error instanceof mongoose.Error.ValidationError ||
             error instanceof mongoose.Error.CastError) {
    status = 400;
    code = 'INVALID_INPUT';
    message = 'Request contains invalid data.';
  } else if (error.code === 11000) {
    status = 409;
    code = 'CONFLICT';
    message = 'A record with the supplied unique value already exists.';
  }

  if (status >= 500) {
    console.error('Request failed', {
      method: req.method,
      path: req.path,
      errorName: error.name || 'Error',
      errorCode: error.code || 'INTERNAL_ERROR'
    });
  }
  res.status(status).json({ error: { code, message } });
}

module.exports = { notFound, errorHandler };
