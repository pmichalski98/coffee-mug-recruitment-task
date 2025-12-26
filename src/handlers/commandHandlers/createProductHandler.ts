import { CreateProductCommand } from "../../commands/products/CreateProductCommand";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";
import { mapProductToIProduct } from "../../utils/productMapper";

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

  return mapProductToIProduct(savedProduct);
};
