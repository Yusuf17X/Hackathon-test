class AppError extends Error {
  constructor(message, statusCode) {
    // this will already set this.message = message;
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // when new object is created and the constructor is called then that function call will not appear in the stacktrace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
