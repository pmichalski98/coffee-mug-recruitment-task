import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid customer ID format"),
  products: z
    .array(
      z.object({
        productId: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
        quantity: z
          .number()
          .positive("Quantity must be greater than 0")
          .int("Quantity must be an integer"),
      })
    )
    .min(1, "At least one product is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
