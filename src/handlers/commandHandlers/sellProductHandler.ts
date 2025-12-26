import { SellProductCommand } from "../../commands/products/SellProductCommand";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";
import { AppError } from "../../middleware/errorHandler";
import { mapProductToIProduct } from "../../utils/productMapper";
import { HTTP_STATUS } from "../../constants";

export const sellProductHandler = async (
  command: SellProductCommand
): Promise<IProduct> => {
  const updatedProduct = await Product.findOneAndUpdate(
    { _id: command.productId, stock: { $gte: command.amount } },
    { $inc: { stock: -command.amount } },
    { new: true }
  );

  if (!updatedProduct) {
    const exists = await Product.exists({ _id: command.productId });
    if (!exists) {
      throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
    }
    throw new AppError("Insufficient stock", HTTP_STATUS.CONFLICT);
  }

  return mapProductToIProduct(updatedProduct);
};
