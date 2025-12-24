import { model, Schema } from "mongoose";
import { IProduct } from "../types";

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, maxLength: 50 },
    description: { type: String, required: true, maxLength: 50 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: false },
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);
