import { Product } from "../../src/models/Product";
import { connectDb, disconnectDb } from "../../src/db";

export const connectTestDb = async (): Promise<void> => {
  await connectDb();
};

export const disconnectTestDb = async (): Promise<void> => {
  await disconnectDb();
};

export const clearDatabase = async (): Promise<void> => {
  await Product.deleteMany({}).exec();
};
