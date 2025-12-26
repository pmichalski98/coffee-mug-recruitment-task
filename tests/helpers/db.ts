import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Product } from "../../src/models/Product";
import { Customer } from "../../src/models/Customer";
import { Order } from "../../src/models/Order";

let mongoServer: MongoMemoryReplSet | null = null;

export const connectTestDb = async (): Promise<void> => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const disconnectTestDb = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearDatabase = async (): Promise<void> => {
  await Product.deleteMany({}).exec();
  await Customer.deleteMany({}).exec();
  await Order.deleteMany({}).exec();
};
