import mongoose from "mongoose";
import { CreateOrderCommand } from "../../commands/orders/CreateOrderCommand";
import { Product } from "../../models/Product";
import { Customer } from "../../models/Customer";
import { Order } from "../../models/Order";
import { IOrder } from "../../types";
import { AppError } from "../../middleware/errorHandler";
import { mapOrderToIOrder } from "../../utils/orderMapper";
import { calculateOrderTotal } from "../../services/discountService";

export const createOrderHandler = async (
  command: CreateOrderCommand
): Promise<IOrder> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customer = await Customer.findById(command.customerId).session(
      session
    );

    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    const productIds = command.products.map((p) => p.productId);
    const products = await Product.find({
      _id: { $in: productIds },
    }).session(session);

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p._id.toString());
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new AppError(`Products not found: ${missingIds.join(", ")}`, 404);
    }

    const totalQuantity = command.products.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    let baseTotal = 0;
    const stockUpdates: Array<{ productId: string; quantity: number }> = [];
    const productInfos: Array<{
      category?: string;
      price: number;
      quantity: number;
    }> = [];

    for (const item of command.products) {
      const product = products.find(
        (p) => p._id.toString() === item.productId
      )!;

      if (product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          409
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

    const orderCalculation = calculateOrderTotal(
      baseTotal,
      totalQuantity,
      customer.location,
      new Date(),
      productInfos
    );

    for (const update of stockUpdates) {
      const product = products.find(
        (p) => p._id.toString() === update.productId
      );
      if (product) {
        product.stock -= update.quantity;
        await product.save({ session });
      }
    }

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
