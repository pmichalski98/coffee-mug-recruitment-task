import { SellProductCommand } from "../../commands/products/SellProductCommand";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";
import { AppError } from "../../middleware/errorHandler";
import { mapProductToIProduct } from "../../utils/productMapper";

export const sellProductHandler = async (
  command: SellProductCommand
): Promise<IProduct> => {
  const product = await Product.findById(command.productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.stock < command.amount) {
    throw new AppError("Insufficient stock", 409);
  }

  product.stock -= command.amount;
  const updatedProduct = await product.save();

  return mapProductToIProduct(updatedProduct);
};
