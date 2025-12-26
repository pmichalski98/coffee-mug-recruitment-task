import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../constants";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  console.error("Unexpected error:", err);
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: "Internal server error",
  });
};
