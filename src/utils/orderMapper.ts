import { Document } from "mongoose";
import { IOrder } from "../types";

export const mapOrderToIOrder = (order: Document & IOrder): IOrder => {
  return {
    id: order._id.toString(),
    customerId: order.customerId,
    products: order.products,
    total: order.total,
    discountApplied: order.discountApplied,
    discountAmount: order.discountAmount,
    createdAt: order.createdAt,
  };
};
