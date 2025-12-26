import { model, Schema } from "mongoose";
import { ICustomer, CUSTOMER_LOCATIONS } from "../types";
import { VALIDATION } from "../constants";

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      maxLength: VALIDATION.NAME_MAX_LENGTH,
    },
    location: { type: String, required: true, enum: CUSTOMER_LOCATIONS },
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>("Customer", customerSchema);
