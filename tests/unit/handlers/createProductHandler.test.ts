import { createProductHandler } from "../../../src/handlers/commandHandlers/createProductHandler";
import { Product } from "../../../src/models/Product";
import {
  connectTestDb,
  clearDatabase,
  disconnectTestDb,
} from "../../helpers/db";

describe("createProductHandler", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("should create a product successfully", async () => {
    const command = {
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
    };

    const result = await createProductHandler(command);

    expect(result).toMatchObject({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();

    const savedProduct = await Product.findById(result.id);
    expect(savedProduct).toBeTruthy();
    expect(savedProduct?.name).toBe("Test Product");
  });

  it("should create a product with optional category", async () => {
    const command = {
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
      category: "electronics",
    };

    const result = await createProductHandler(command);

    expect(result.category).toBe("electronics");
  });
});
