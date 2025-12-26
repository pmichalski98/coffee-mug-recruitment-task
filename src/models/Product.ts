import { model, Schema } from "mongoose";
import { IProduct } from "../types";
import { VALIDATION } from "../constants";

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      maxLength: VALIDATION.NAME_MAX_LENGTH,
    },
    description: {
      type: String,
      required: true,
      maxLength: VALIDATION.DESCRIPTION_MAX_LENGTH,
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: false },
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);
