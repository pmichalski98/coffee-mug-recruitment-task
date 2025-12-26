import { restockProductHandler } from "../../../src/handlers/commandHandlers/restockProductHandler";
import { Product } from "../../../src/models/Product";
import { AppError } from "../../../src/middleware/errorHandler";
import {
  connectTestDb,
  clearDatabase,
  disconnectTestDb,
} from "../../helpers/db";

describe("restockProductHandler", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("should restock a product successfully", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
    });

    const command = {
      productId: product._id.toString(),
      amount: 50,
    };

    const result = await restockProductHandler(command);

    expect(result.stock).toBe(150);
    expect(result.id).toBe(product._id.toString());

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.stock).toBe(150);
  });

  it("should throw 404 if product not found", async () => {
    const command = {
      productId: "507f1f77bcf86cd799439011",
      amount: 50,
    };

    await expect(restockProductHandler(command)).rejects.toThrow(AppError);
    await expect(restockProductHandler(command)).rejects.toThrow(
      "Product not found"
    );

    try {
      await restockProductHandler(command);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.statusCode).toBe(404);
      }
    }
  });

  it("should handle multiple restocks correctly", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
    });

    await restockProductHandler({
      productId: product._id.toString(),
      amount: 25,
    });

    await restockProductHandler({
      productId: product._id.toString(),
      amount: 75,
    });

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.stock).toBe(200);
  });

  it("should restock product with zero initial stock", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 0,
    });

    const result = await restockProductHandler({
      productId: product._id.toString(),
      amount: 100,
    });

    expect(result.stock).toBe(100);
  });
});
