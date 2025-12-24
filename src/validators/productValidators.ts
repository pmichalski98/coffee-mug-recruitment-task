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
