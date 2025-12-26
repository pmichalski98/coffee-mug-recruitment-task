import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { HTTP_STATUS } from "../constants";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: `Validation failed: ${error.issues.length} error(s) in body`,
          details: error.issues,
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: `Validation failed: ${error.issues.length} error(s) in params`,
          details: error.issues,
        });
      }
      next(error);
    }
  };
};
