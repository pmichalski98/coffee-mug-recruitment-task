import request from "supertest";
import app from "../../src/app";
import { Product } from "../../src/models/Product";
import { connectTestDb, clearDatabase, disconnectTestDb } from "../helpers/db";

describe("Products API", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("GET /api/products", () => {
    it("should return an empty array when no products exist", async () => {
      const response = await request(app).get("/api/products");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
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

      const response = await request(app).get("/api/products");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
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
    });
  });

  describe("POST /api/products", () => {
    it("should create a product successfully", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: 29.99,
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: "New Product",
        description: "New Description",
        price: 29.99,
        stock: 100,
      });
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      const savedProduct = await Product.findById(response.body.id);
      expect(savedProduct).toBeTruthy();
      expect(savedProduct?.name).toBe("New Product");
    });

    it("should create a product with optional category", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: 29.99,
        stock: 100,
        category: "electronics",
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(201);

      expect(response.body.category).toBe("electronics");
    });

    it("should return 400 if name is missing", async () => {
      const productData = {
        description: "New Description",
        price: 29.99,
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
      expect(response.body.details).toBeInstanceOf(Array);
    });

    it("should return 400 if name exceeds 50 characters", async () => {
      const productData = {
        name: "a".repeat(51),
        description: "New Description",
        price: 29.99,
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if description is missing", async () => {
      const productData = {
        name: "New Product",
        price: 29.99,
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if description exceeds 50 characters", async () => {
      const productData = {
        name: "New Product",
        description: "a".repeat(51),
        price: 29.99,
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if price is missing", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if price is not positive", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: -10,
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if price is zero", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: 0,
        stock: 100,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if stock is missing", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: 29.99,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if stock is negative", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: 29.99,
        stock: -10,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if stock is not an integer", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: 29.99,
        stock: 10.5,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should accept stock of zero", async () => {
      const productData = {
        name: "New Product",
        description: "New Description",
        price: 29.99,
        stock: 0,
      };

      const response = await request(app)
        .post("/api/products")
        .send(productData)
        .expect(201);

      expect(response.body.stock).toBe(0);
    });
  });
});
