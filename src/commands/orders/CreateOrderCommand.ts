import { IOrderItem } from "../../types";

export interface CreateOrderCommand {
  customerId: string;
  products: IOrderItem[];
}
