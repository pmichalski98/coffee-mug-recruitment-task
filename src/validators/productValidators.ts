import { z } from "zod";
import { VALIDATION } from "../constants";

const mongoObjectIdSchema = z
  .string()
  .regex(VALIDATION.MONGODB_OBJECT_ID_REGEX, "Invalid ID format");

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(
      VALIDATION.NAME_MAX_LENGTH,
      `Name must be at most ${VALIDATION.NAME_MAX_LENGTH} characters`
    ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(
      VALIDATION.DESCRIPTION_MAX_LENGTH,
      `Description must be at most ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`
    ),
  price: z.number().positive("Price must be a positive number"),
  stock: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock must be non-negative"),
  category: z.string().optional(),
});

export const restockProductSchema = z.object({
  amount: z
    .number()
    .int("Amount must be an integer")
    .positive("Amount must be greater than 0"),
});

export const sellProductSchema = z.object({
  amount: z
    .number()
    .int("Amount must be an integer")
    .positive("Amount must be greater than 0"),
});

export const productIdParamSchema = z.object({
  id: mongoObjectIdSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type RestockProductInput = z.infer<typeof restockProductSchema>;
export type SellProductInput = z.infer<typeof sellProductSchema>;
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
