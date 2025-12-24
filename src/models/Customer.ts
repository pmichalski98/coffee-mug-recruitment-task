import { model, Schema } from "mongoose";
import { ICustomer } from "../types";

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, maxLength: 50 },
    location: { type: String, required: true, enum: ["US", "EU", "ASIA"] },
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", customerSchema);
