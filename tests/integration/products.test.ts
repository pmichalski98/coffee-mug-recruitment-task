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

  describe("POST /api/products/:id/restock", () => {
    it("should restock a product successfully", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/restock`)
        .send({ amount: 50 })
        .expect(200);

      expect(response.body.stock).toBe(150);
      expect(response.body.id).toBe(product._id.toString());

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct?.stock).toBe(150);
    });

    it("should return 404 if product not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .post(`/api/products/${fakeId}/restock`)
        .send({ amount: 50 })
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Product not found");
    });

    it("should return 400 if amount is missing", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/restock`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if amount is not positive", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/restock`)
        .send({ amount: -10 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if amount is zero", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/restock`)
        .send({ amount: 0 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if amount is not an integer", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/restock`)
        .send({ amount: 10.5 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if product ID format is invalid", async () => {
      const response = await request(app)
        .post("/api/products/invalid-id/restock")
        .send({ amount: 50 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should handle multiple restocks correctly", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      await request(app)
        .post(`/api/products/${product._id.toString()}/restock`)
        .send({ amount: 25 })
        .expect(200);

      await request(app)
        .post(`/api/products/${product._id.toString()}/restock`)
        .send({ amount: 75 })
        .expect(200);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct?.stock).toBe(200);
    });
  });

  describe("POST /api/products/:id/sell", () => {
    it("should sell a product successfully", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 30 })
        .expect(200);

      expect(response.body.stock).toBe(70);
      expect(response.body.id).toBe(product._id.toString());

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct?.stock).toBe(70);
    });

    it("should return 404 if product not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .post(`/api/products/${fakeId}/sell`)
        .send({ amount: 30 })
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Product not found");
    });

    it("should return 409 if insufficient stock", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 50,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 100 })
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Insufficient stock");

      const unchangedProduct = await Product.findById(product._id);
      expect(unchangedProduct?.stock).toBe(50);
    });

    it("should return 400 if amount is missing", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if amount is not positive", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: -10 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if amount is zero", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 0 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if amount is not an integer", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 10.5 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if product ID format is invalid", async () => {
      const response = await request(app)
        .post("/api/products/invalid-id/sell")
        .send({ amount: 30 })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should sell exact stock amount", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 50,
      });

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 50 })
        .expect(200);

      expect(response.body.stock).toBe(0);

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

      await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 25 })
        .expect(200);

      await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 30 })
        .expect(200);

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

      const response = await request(app)
        .post(`/api/products/${product._id.toString()}/sell`)
        .send({ amount: 1 })
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Insufficient stock");
    });
  });
});
