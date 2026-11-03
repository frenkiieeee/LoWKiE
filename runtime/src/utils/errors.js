"use strict";
class AppError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status || 400;
  }
}
module.exports = { AppError };
