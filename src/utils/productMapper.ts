import { Document } from "mongoose";
import { IProduct } from "../types";

export const mapProductToIProduct = (
  product: Document & IProduct
): IProduct => {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};
