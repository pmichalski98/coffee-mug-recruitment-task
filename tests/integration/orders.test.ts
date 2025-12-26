import request from "supertest";
import app from "../../src/app";
import { Product } from "../../src/models/Product";
import { Customer } from "../../src/models/Customer";
import { Order } from "../../src/models/Order";
import { connectTestDb, clearDatabase, disconnectTestDb } from "../helpers/db";

describe("Orders API", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("POST /api/orders", () => {
    it("should create an order successfully", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 2,
            },
          ],
        })
        .expect(201);

      expect(response.body).toMatchObject({
        customerId: customer._id.toString(),
        total: 59.98,
      });
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body.products).toHaveLength(1);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct?.stock).toBe(98);
    });

    it("should create an order with multiple products", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product1 = await Product.create({
        name: "Product 1",
        description: "Description 1",
        price: 10,
        stock: 50,
      });

      const product2 = await Product.create({
        name: "Product 2",
        description: "Description 2",
        price: 20,
        stock: 30,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product1._id.toString(),
              quantity: 3,
            },
            {
              productId: product2._id.toString(),
              quantity: 2,
            },
          ],
        })
        .expect(201);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.discountApplied).toBe("volume");
      expect(response.body.total).toBeCloseTo(63, 0);

      const updatedProduct1 = await Product.findById(product1._id);
      const updatedProduct2 = await Product.findById(product2._id);
      expect(updatedProduct1?.stock).toBe(47);
      expect(updatedProduct2?.stock).toBe(28);
    });

    it("should return 404 if customer not found", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: "507f1f77bcf86cd799439011",
          products: [
            {
              productId: product._id.toString(),
              quantity: 2,
            },
          ],
        })
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Customer not found");
    });

    it("should return 404 if product not found", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: "507f1f77bcf86cd799439011",
              quantity: 2,
            },
          ],
        })
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Products not found");
    });

    it("should return 409 if insufficient stock", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 5,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 10,
            },
          ],
        })
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Insufficient stock");

      const unchangedProduct = await Product.findById(product._id);
      expect(unchangedProduct?.stock).toBe(5);
    });

    it("should return 400 if customerId is missing", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          products: [
            {
              productId: product._id.toString(),
              quantity: 2,
            },
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if customerId format is invalid", async () => {
      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: "invalid-id",
          products: [
            {
              productId: product._id.toString(),
              quantity: 2,
            },
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if products array is empty", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if products is missing", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if productId format is invalid", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: "invalid-product-id",
              quantity: 2,
            },
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if quantity is not positive", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 0,
            },
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should return 400 if quantity is not an integer", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 29.99,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 2.5,
            },
          ],
        })
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("details");
    });

    it("should apply EU location pricing (+15%)", async () => {
      const customer = await Customer.create({
        name: "EU Customer",
        location: "EU",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 100,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 1,
            },
          ],
        })
        .expect(201);

      expect(response.body.total).toBeCloseTo(115, 2);
    });

    it("should apply ASIA location pricing (-5%)", async () => {
      const customer = await Customer.create({
        name: "Asia Customer",
        location: "ASIA",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 100,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 1,
            },
          ],
        })
        .expect(201);

      expect(response.body.total).toBe(95);
    });

    it("should apply 10% volume discount for 5+ items", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 10,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 5,
            },
          ],
        })
        .expect(201);

      expect(response.body.discountApplied).toBe("volume");
      expect(response.body.discountAmount).toBe(5);
      expect(response.body.total).toBe(45);
    });

    it("should apply 20% volume discount for 10+ items", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 10,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 10,
            },
          ],
        })
        .expect(201);

      expect(response.body.discountApplied).toBe("volume");
      expect(response.body.discountAmount).toBe(20);
      expect(response.body.total).toBe(80);
    });

    it("should apply 30% volume discount for 50+ items", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 10,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 50,
            },
          ],
        })
        .expect(201);

      expect(response.body.discountApplied).toBe("volume");
      expect(response.body.discountAmount).toBe(150);
      expect(response.body.total).toBe(350);
    });

    it("should not apply discount for less than 5 items", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 10,
        stock: 100,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 4,
            },
          ],
        })
        .expect(201);

      expect(response.body.discountApplied).toBeUndefined();
      expect(response.body.discountAmount).toBeUndefined();
      expect(response.body.total).toBe(40);
    });

    it("should not create order and rollback if stock check fails for multiple products", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product1 = await Product.create({
        name: "Product 1",
        description: "Description 1",
        price: 10,
        stock: 10,
      });

      const product2 = await Product.create({
        name: "Product 2",
        description: "Description 2",
        price: 20,
        stock: 5,
      });

      await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product1._id.toString(),
              quantity: 5,
            },
            {
              productId: product2._id.toString(),
              quantity: 10,
            },
          ],
        })
        .expect(409);

      const unchangedProduct1 = await Product.findById(product1._id);
      const unchangedProduct2 = await Product.findById(product2._id);
      expect(unchangedProduct1?.stock).toBe(10);
      expect(unchangedProduct2?.stock).toBe(5);

      const orders = await Order.find({});
      expect(orders).toHaveLength(0);
    });

    it("should allow ordering exact remaining stock", async () => {
      const customer = await Customer.create({
        name: "Test Customer",
        location: "US",
      });

      const product = await Product.create({
        name: "Test Product",
        description: "Test Description",
        price: 10,
        stock: 5,
      });

      const response = await request(app)
        .post("/api/orders")
        .send({
          customerId: customer._id.toString(),
          products: [
            {
              productId: product._id.toString(),
              quantity: 5,
            },
          ],
        })
        .expect(201);

      expect(response.body.total).toBe(45);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct?.stock).toBe(0);
    });
  });
});
