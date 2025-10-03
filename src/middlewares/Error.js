export class Errorhandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor); // optional but useful
  }
}

export const errorMiddleWare = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Handle known errors (MongoDB, JWT, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid: ${err.path}` });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: `Duplicate ${Object.keys(err.keyValue)} entered` });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token Expired" });
  }

  // Default error response
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
