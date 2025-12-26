import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .max(50, "Name must be at most 50 characters")
    .min(1, "Name is required"),
  description: z
    .string()
    .max(50, "Description must be at most 50 characters")
    .min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  stock: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock must be non-negative"),
  category: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const restockProductSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .int("Amount must be an integer"),
});

export const sellProductSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .int("Amount must be an integer"),
});

export type RestockProductInput = z.infer<typeof restockProductSchema>;
export type SellProductInput = z.infer<typeof sellProductSchema>;

export const productIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;
