import mongoose from "mongoose";
import { CreateOrderCommand } from "../../commands/orders/CreateOrderCommand";
import { Product } from "../../models/Product";
import { Customer } from "../../models/Customer";
import { Order } from "../../models/Order";
import { IOrder } from "../../types";
import { AppError } from "../../middleware/errorHandler";
import { mapOrderToIOrder } from "../../utils/orderMapper";
import { calculateOrderTotal } from "../../services/discountService";
import { HTTP_STATUS } from "../../constants";

interface ProductInfo {
  category?: string;
  price: number;
  quantity: number;
}

interface StockUpdate {
  productId: string;
  quantity: number;
}

const findCustomerOrThrow = async (
  customerId: string,
  session: mongoose.ClientSession
) => {
  const customer = await Customer.findById(customerId).session(session);

  if (!customer) {
    throw new AppError("Customer not found", HTTP_STATUS.NOT_FOUND);
  }

  return customer;
};

const findProductsOrThrow = async (
  productIds: string[],
  session: mongoose.ClientSession
) => {
  const products = await Product.find({ _id: { $in: productIds } }).session(
    session
  );

  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map((p) => p._id.toString()));
    const missingIds = productIds.filter((id) => !foundIds.has(id));
    throw new AppError(
      `Products not found: ${missingIds.join(", ")}`,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return products;
};

const validateStockAndPrepareData = (
  commandProducts: CreateOrderCommand["products"],
  dbProducts: Awaited<ReturnType<typeof findProductsOrThrow>>
) => {
  let baseTotal = 0;
  const stockUpdates: StockUpdate[] = [];
  const productInfos: ProductInfo[] = [];

  for (const item of commandProducts) {
    const product = dbProducts.find(
      (p) => p._id.toString() === item.productId
    )!;

    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        HTTP_STATUS.CONFLICT
      );
    }

    baseTotal += product.price * item.quantity;
    stockUpdates.push({
      productId: product._id.toString(),
      quantity: item.quantity,
    });
    productInfos.push({
      category: product.category,
      price: product.price,
      quantity: item.quantity,
    });
  }

  return { baseTotal, stockUpdates, productInfos };
};

const updateProductStocks = async (
  stockUpdates: StockUpdate[],
  dbProducts: Awaited<ReturnType<typeof findProductsOrThrow>>,
  session: mongoose.ClientSession
) => {
  for (const update of stockUpdates) {
    const product = dbProducts.find(
      (p) => p._id.toString() === update.productId
    );
    if (product) {
      product.stock -= update.quantity;
      await product.save({ session });
    }
  }
};

export const createOrderHandler = async (
  command: CreateOrderCommand
): Promise<IOrder> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customer = await findCustomerOrThrow(command.customerId, session);
    const productIds = command.products.map((p) => p.productId);
    const products = await findProductsOrThrow(productIds, session);

    const totalQuantity = command.products.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const { baseTotal, stockUpdates, productInfos } =
      validateStockAndPrepareData(command.products, products);

    const orderCalculation = calculateOrderTotal(
      baseTotal,
      totalQuantity,
      customer.location,
      new Date(),
      productInfos
    );

    await updateProductStocks(stockUpdates, products, session);

    const order = new Order({
      customerId: command.customerId,
      products: command.products,
      total: orderCalculation.total,
      discountApplied:
        orderCalculation.discountType !== "none"
          ? orderCalculation.discountType
          : undefined,
      discountAmount:
        orderCalculation.discountAmount > 0
          ? orderCalculation.discountAmount
          : undefined,
    });

    await order.save({ session });
    await session.commitTransaction();

    return mapOrderToIOrder(order);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
