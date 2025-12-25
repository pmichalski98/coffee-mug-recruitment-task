import { getProductsHandler } from "../../../src/handlers/queryHandlers/getProductsHandler";
import { Product } from "../../../src/models/Product";
import {
  connectTestDb,
  clearDatabase,
  disconnectTestDb,
} from "../../helpers/db";

describe("getProductsHandler", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("should return an empty array when no products exist", async () => {
    const result = await getProductsHandler({});

    expect(result).toEqual([]);
  });

  it("should return all products", async () => {
    const product1 = await Product.create({
      name: "Product 1",
      description: "Description 1",
      price: 10.99,
      stock: 50,
    });

    const product2 = await Product.create({
      name: "Product 2",
      description: "Description 2",
      price: 20.99,
      stock: 30,
      category: "electronics",
    });

    const result = await getProductsHandler({});

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Product 1",
          description: "Description 1",
          price: 10.99,
          stock: 50,
        }),
        expect.objectContaining({
          name: "Product 2",
          description: "Description 2",
          price: 20.99,
          stock: 30,
          category: "electronics",
        }),
      ])
    );

    result.forEach((product) => {
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("description");
      expect(product).toHaveProperty("price");
      expect(product).toHaveProperty("stock");
      expect(product).toHaveProperty("createdAt");
      expect(product).toHaveProperty("updatedAt");
    });
  });
});
