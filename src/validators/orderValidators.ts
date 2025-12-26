import { z } from "zod";
import { VALIDATION } from "../constants";

const mongoObjectIdSchema = z
  .string()
  .regex(VALIDATION.MONGODB_OBJECT_ID_REGEX, "Invalid ID format");

const orderItemSchema = z.object({
  productId: mongoObjectIdSchema,
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
});

export const createOrderSchema = z.object({
  customerId: mongoObjectIdSchema,
  products: z.array(orderItemSchema).min(1, "At least one product is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
