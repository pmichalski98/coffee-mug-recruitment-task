import { GetProductsQuery } from "../../queries/products/GetProductsQuery";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";
import { mapProductToIProduct } from "../../utils/productMapper";

export const getProductsHandler = async (
  query: GetProductsQuery
): Promise<IProduct[]> => {
  const products = await Product.find({});

  return products.map(mapProductToIProduct);
};
