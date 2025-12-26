import { createOrderHandler } from "../../../src/handlers/commandHandlers/createOrderHandler";
import { Product } from "../../../src/models/Product";
import { Customer } from "../../../src/models/Customer";
import { Order } from "../../../src/models/Order";
import { AppError } from "../../../src/middleware/errorHandler";
import {
  connectTestDb,
  clearDatabase,
  disconnectTestDb,
} from "../../helpers/db";
import Holidays from "date-holidays";

describe("createOrderHandler", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

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

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 2,
        },
      ],
    };

    const result = await createOrderHandler(command);

    expect(result.customerId).toBe(customer._id.toString());
    expect(result.products).toHaveLength(1);
    expect(result.products[0].productId).toBe(product._id.toString());
    expect(result.products[0].quantity).toBe(2);
    expect(result.total).toBe(59.98);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();

    const savedOrder = await Order.findById(result.id);
    expect(savedOrder).toBeTruthy();

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
      price: 10.99,
      stock: 50,
    });

    const product2 = await Product.create({
      name: "Product 2",
      description: "Description 2",
      price: 20.99,
      stock: 30,
    });

    const command = {
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
    };

    const result = await createOrderHandler(command);

    expect(result.products).toHaveLength(2);
    const expectedTotal = (10.99 * 3 + 20.99 * 2) * 0.9;
    expect(result.total).toBeCloseTo(expectedTotal, 2);

    const updatedProduct1 = await Product.findById(product1._id);
    const updatedProduct2 = await Product.findById(product2._id);
    expect(updatedProduct1?.stock).toBe(47);
    expect(updatedProduct2?.stock).toBe(28);
  });

  it("should throw 404 if customer not found", async () => {
    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 100,
    });

    const command = {
      customerId: "507f1f77bcf86cd799439011",
      products: [
        {
          productId: product._id.toString(),
          quantity: 2,
        },
      ],
    };

    await expect(createOrderHandler(command)).rejects.toThrow(AppError);
    await expect(createOrderHandler(command)).rejects.toThrow(
      "Customer not found"
    );

    try {
      await createOrderHandler(command);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.statusCode).toBe(404);
      }
    }
  });

  it("should throw 404 if product not found", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: "507f1f77bcf86cd799439011",
          quantity: 2,
        },
      ],
    };

    await expect(createOrderHandler(command)).rejects.toThrow(AppError);
    await expect(createOrderHandler(command)).rejects.toThrow(
      "Products not found"
    );
  });

  it("should throw 404 if some products not found", async () => {
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

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 2,
        },
        {
          productId: "507f1f77bcf86cd799439011",
          quantity: 1,
        },
      ],
    };

    await expect(createOrderHandler(command)).rejects.toThrow(AppError);
    await expect(createOrderHandler(command)).rejects.toThrow(
      "Products not found"
    );
  });

  it("should throw 409 if insufficient stock", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 50,
    });

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 100,
        },
      ],
    };

    await expect(createOrderHandler(command)).rejects.toThrow(AppError);
    await expect(createOrderHandler(command)).rejects.toThrow(
      "Insufficient stock"
    );

    try {
      await createOrderHandler(command);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.statusCode).toBe(409);
      }
    }

    const unchangedProduct = await Product.findById(product._id);
    expect(unchangedProduct?.stock).toBe(50);
  });

  it("should throw 409 if insufficient stock for one of multiple products", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

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
      stock: 5,
    });

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product1._id.toString(),
          quantity: 10,
        },
        {
          productId: product2._id.toString(),
          quantity: 10,
        },
      ],
    };

    await expect(createOrderHandler(command)).rejects.toThrow(AppError);
    await expect(createOrderHandler(command)).rejects.toThrow(
      "Insufficient stock"
    );
  });

  it("should apply EU location adjustment (+15% VAT)", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "EU",
    });

    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 100,
      stock: 100,
    });

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 1,
        },
      ],
    };

    const result = await createOrderHandler(command);

    expect(result.total).toBeCloseTo(115, 2);
  });

  it("should apply ASIA location adjustment (-5% discount)", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "ASIA",
    });

    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 100,
      stock: 100,
    });

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 1,
        },
      ],
    };

    const result = await createOrderHandler(command);

    expect(result.total).toBe(95);
  });

  it("should apply volume discount (10% for 5+ items)", async () => {
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

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 5,
        },
      ],
    };

    const result = await createOrderHandler(command);

    expect(result.discountApplied).toBe("volume");
    expect(result.discountAmount).toBe(5);
    expect(result.total).toBe(45);
  });

  it("should apply volume discount (20% for 10+ items)", async () => {
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

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 10,
        },
      ],
    };

    const result = await createOrderHandler(command);

    expect(result.discountApplied).toBe("volume");
    expect(result.discountAmount).toBe(20);
    expect(result.total).toBe(80);
  });

  it("should apply volume discount (30% for 50+ items)", async () => {
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

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 50,
        },
      ],
    };

    const result = await createOrderHandler(command);

    expect(result.discountApplied).toBe("volume");
    expect(result.discountAmount).toBe(150);
    expect(result.total).toBe(350);
  });

  it("should apply holiday discount to electronics category", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

    const eligibleProduct = await Product.create({
      name: "Electronics Product",
      description: "Description",
      price: 100,
      stock: 100,
      category: "electronics",
    });

    const hd = new Holidays("PL");
    const today = new Date();
    const holidays = hd.getHolidays(today.getFullYear());
    const isHolidayDate = holidays.some((h: any) => {
      const holidayDate = new Date(h.date as string | Date);
      return (
        holidayDate.getMonth() === today.getMonth() &&
        holidayDate.getDate() === today.getDate()
      );
    });

    if (isHolidayDate) {
      const command = {
        customerId: customer._id.toString(),
        products: [
          {
            productId: eligibleProduct._id.toString(),
            quantity: 1,
          },
        ],
      };

      const result = await createOrderHandler(command);

      expect(result.discountApplied).toBe("holiday");
      expect(result.discountAmount).toBe(15);
      expect(result.total).toBe(85);
    }
  });

  it("should apply holiday discount to clothing category", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

    const eligibleProduct = await Product.create({
      name: "Clothing Product",
      description: "Description",
      price: 100,
      stock: 100,
      category: "clothing",
    });

    const hd = new Holidays("PL");
    const today = new Date();
    const holidays = hd.getHolidays(today.getFullYear());
    const isHolidayDate = holidays.some((h: any) => {
      const holidayDate = new Date(h.date as string | Date);
      return (
        holidayDate.getMonth() === today.getMonth() &&
        holidayDate.getDate() === today.getDate()
      );
    });

    if (isHolidayDate) {
      const command = {
        customerId: customer._id.toString(),
        products: [
          {
            productId: eligibleProduct._id.toString(),
            quantity: 1,
          },
        ],
      };

      const result = await createOrderHandler(command);

      expect(result.discountApplied).toBe("holiday");
      expect(result.discountAmount).toBe(15);
      expect(result.total).toBe(85);
    }
  });

  it("should apply holiday discount only to eligible categories", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

    const eligibleProduct = await Product.create({
      name: "Electronics Product",
      description: "Description",
      price: 100,
      stock: 100,
      category: "electronics",
    });

    const ineligibleProduct = await Product.create({
      name: "Other Product",
      description: "Description",
      price: 100,
      stock: 100,
      category: "books",
    });

    const hd = new Holidays("PL");
    const today = new Date();
    const holidays = hd.getHolidays(today.getFullYear());
    const isHolidayDate = holidays.some((h: any) => {
      const holidayDate = new Date(h.date as string | Date);
      return (
        holidayDate.getMonth() === today.getMonth() &&
        holidayDate.getDate() === today.getDate()
      );
    });

    if (isHolidayDate) {
      const command = {
        customerId: customer._id.toString(),
        products: [
          {
            productId: eligibleProduct._id.toString(),
            quantity: 1,
          },
          {
            productId: ineligibleProduct._id.toString(),
            quantity: 1,
          },
        ],
      };

      const result = await createOrderHandler(command);

      expect(result.discountApplied).toBe("holiday");
      expect(result.discountAmount).toBe(15);
      expect(result.total).toBe(185);
    } else {
      const command = {
        customerId: customer._id.toString(),
        products: [
          {
            productId: eligibleProduct._id.toString(),
            quantity: 1,
          },
          {
            productId: ineligibleProduct._id.toString(),
            quantity: 1,
          },
        ],
      };

      const result = await createOrderHandler(command);

      expect(result.discountApplied).not.toBe("holiday");
      expect(result.total).toBe(200);
    }
  });

  it("should apply highest discount when multiple discounts are eligible", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

    const product = await Product.create({
      name: "Electronics Product",
      description: "Description",
      price: 100,
      stock: 100,
      category: "electronics",
    });

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 50,
        },
      ],
    };

    const result = await createOrderHandler(command);

    expect(result.discountApplied).toBe("volume");
    expect(result.discountAmount).toBe(1500);
    expect(result.total).toBe(3500);
  });

  it("should rollback transaction on error", async () => {
    const customer = await Customer.create({
      name: "Test Customer",
      location: "US",
    });

    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 29.99,
      stock: 50,
    });

    const command = {
      customerId: customer._id.toString(),
      products: [
        {
          productId: product._id.toString(),
          quantity: 100,
        },
      ],
    };

    try {
      await createOrderHandler(command);
    } catch (error) {
      // Expected to throw
    }

    const unchangedProduct = await Product.findById(product._id);
    expect(unchangedProduct?.stock).toBe(50);

    const orders = await Order.find({});
    expect(orders).toHaveLength(0);
  });

  it("should not create order if stock check fails", async () => {
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

    const command = {
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
    };

    await expect(createOrderHandler(command)).rejects.toThrow(AppError);

    const unchangedProduct1 = await Product.findById(product1._id);
    const unchangedProduct2 = await Product.findById(product2._id);
    expect(unchangedProduct1?.stock).toBe(10);
    expect(unchangedProduct2?.stock).toBe(5);

    const orders = await Order.find({});
    expect(orders).toHaveLength(0);
  });
});
