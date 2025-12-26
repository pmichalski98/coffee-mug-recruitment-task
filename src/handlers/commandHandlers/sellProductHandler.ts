import { SellProductCommand } from "../../commands/products/SellProductCommand";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";
import { AppError } from "../../middleware/errorHandler";
import { mapProductToIProduct } from "../../utils/productMapper";
import { HTTP_STATUS } from "../../constants";

export const sellProductHandler = async (
  command: SellProductCommand
): Promise<IProduct> => {
  const product = await Product.findById(command.productId);

  if (!product) {
    throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  if (product.stock < command.amount) {
    throw new AppError("Insufficient stock", HTTP_STATUS.CONFLICT);
  }

  product.stock -= command.amount;
  const updatedProduct = await product.save();

  return mapProductToIProduct(updatedProduct);
};
