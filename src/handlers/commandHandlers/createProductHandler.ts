import { CreateProductCommand } from "../../commands/products/CreateProductCommand";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";

export const createProductHandler = async (
  command: CreateProductCommand
): Promise<IProduct> => {
  const product = new Product({
    name: command.name,
    description: command.description,
    price: command.price,
    stock: command.stock,
    category: command.category,
  });

  const savedProduct = await product.save();

  return {
    id: savedProduct._id.toString(),
    name: savedProduct.name,
    description: savedProduct.description,
    price: savedProduct.price,
    stock: savedProduct.stock,
    category: savedProduct.category,
    createdAt: savedProduct.createdAt,
    updatedAt: savedProduct.updatedAt,
  };
};
