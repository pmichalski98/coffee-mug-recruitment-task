import { sellProductHandler } from "../../../src/handlers/commandHandlers/sellProductHandler";
import { Product } from "../../../src/models/Product";
import { AppError } from "../../../src/middleware/errorHandler";
import {
  connectTestDb,
  clearDatabase,
  disconnectTestDb,
} from "../../helpers/db";

describe("sellProductHandler", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("should sell a product successfully", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
    });

    const command = {
      productId: product._id.toString(),
      amount: 30,
    };

    const result = await sellProductHandler(command);

    expect(result.stock).toBe(70);
    expect(result.id).toBe(product._id.toString());

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.stock).toBe(70);
  });

  it("should throw 404 if product not found", async () => {
    const command = {
      productId: "507f1f77bcf86cd799439011",
      amount: 30,
    };

    await expect(sellProductHandler(command)).rejects.toThrow(AppError);
    await expect(sellProductHandler(command)).rejects.toThrow(
      "Product not found"
    );

    try {
      await sellProductHandler(command);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.statusCode).toBe(404);
      }
    }
  });

  it("should throw 409 if insufficient stock", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 50,
    });

    const command = {
      productId: product._id.toString(),
      amount: 100,
    };

    await expect(sellProductHandler(command)).rejects.toThrow(AppError);
    await expect(sellProductHandler(command)).rejects.toThrow(
      "Insufficient stock"
    );

    try {
      await sellProductHandler(command);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.statusCode).toBe(409);
      }
    }

    const unchangedProduct = await Product.findById(product._id);
    expect(unchangedProduct?.stock).toBe(50);
  });

  it("should sell exact stock amount", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 50,
    });

    const result = await sellProductHandler({
      productId: product._id.toString(),
      amount: 50,
    });

    expect(result.stock).toBe(0);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.stock).toBe(0);
  });

  it("should handle multiple sells correctly", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
    });

    await sellProductHandler({
      productId: product._id.toString(),
      amount: 25,
    });

    await sellProductHandler({
      productId: product._id.toString(),
      amount: 30,
    });

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.stock).toBe(45);
  });

  it("should not allow selling when stock is zero", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 0,
    });

    const command = {
      productId: product._id.toString(),
      amount: 1,
    };

    await expect(sellProductHandler(command)).rejects.toThrow(AppError);
    await expect(sellProductHandler(command)).rejects.toThrow(
      "Insufficient stock"
    );
  });
});
