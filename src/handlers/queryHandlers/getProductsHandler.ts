import { GetProductsQuery } from "../../queries/products/GetProductsQuery";
import { Product } from "../../models/Product";
import { IProduct } from "../../types";

export const getProductsHandler = async (
  query: GetProductsQuery
): Promise<IProduct[]> => {
  const products = await Product.find({});

  return products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }));
};
