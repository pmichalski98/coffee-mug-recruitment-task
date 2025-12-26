import { RestockProductCommand } from "../../commands/products/RestockProductCommand";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";
import { AppError } from "../../middleware/errorHandler";
import { mapProductToIProduct } from "../../utils/productMapper";
import { HTTP_STATUS } from "../../constants";

export const restockProductHandler = async (
  command: RestockProductCommand
): Promise<IProduct> => {
  const product = await Product.findById(command.productId);

  if (!product) {
    throw new AppError("Product not found", HTTP_STATUS.NOT_FOUND);
  }

  product.stock += command.amount;
  const updatedProduct = await product.save();

  return mapProductToIProduct(updatedProduct);
};
