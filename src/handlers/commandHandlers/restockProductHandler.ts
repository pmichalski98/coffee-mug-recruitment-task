import { RestockProductCommand } from "../../commands/products/RestockProductCommand";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";
import { AppError } from "../../middleware/errorHandler";
import { mapProductToIProduct } from "../../utils/productMapper";
import { HTTP_STATUS } from "../../constants";

export const restockProductHandler = async (
  command: RestockProductCommand
): Promise<IProduct> => {
  const updatedProduct = await Product.findByIdAndUpdate(
    command.productId,
    { $inc: { stock: command.amount } },
    { new: true }
  );

  if (!updatedProduct) {
    throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  return mapProductToIProduct(updatedProduct);
};
