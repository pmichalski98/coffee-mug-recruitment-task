import { model, Schema } from "mongoose";
import { IOrder, IOrderItem } from "../types";

const orderSchema = new Schema<IOrder>(
  {
    customerId: { type: String, required: true },
    products: {
      type: [Schema.Types.Mixed] as unknown as IOrderItem[],
      required: true,
    },
    total: { type: Number, required: true, min: 0 },
    discountApplied: { type: String, required: false },
    discountAmount: { type: Number, required: false },
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", orderSchema);
