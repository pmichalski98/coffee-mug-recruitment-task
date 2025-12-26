import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDb } from "./db";

const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDb();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch(console.error);
