import Holidays from "date-holidays";
import { DiscountType } from "../types";

interface DiscountResult {
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
}

interface ProductInfo {
  category?: string;
  price: number;
  quantity: number;
}

const HOLIDAY_ELIGIBLE_CATEGORIES = ["electronics", "clothing"];

const isBlackFriday = (date: Date): boolean => {
  const year = date.getFullYear();
  const lastDay = new Date(year, 11, 0);
  let lastFriday = lastDay;

  while (lastFriday.getDay() !== 5) {
    lastFriday = new Date(lastFriday.getTime() - 24 * 60 * 60 * 1000);
  }

  return date.getMonth() === 10 && date.getDate() === lastFriday.getDate();
};

const isHoliday = (date: Date): boolean => {
  const hd = new Holidays("PL");
  const holidays = hd.getHolidays(date.getFullYear());
  return holidays.some((holiday) => {
    const holidayDate = new Date(holiday.date as string | Date);
    return (
      holidayDate.getMonth() === date.getMonth() &&
      holidayDate.getDate() === date.getDate()
    );
  });
};

const calculateVolumeDiscount = (totalQuantity: number): number => {
  if (totalQuantity >= 30) return 30;
  if (totalQuantity >= 20) return 20;
  if (totalQuantity >= 10) return 10;
  return 0;
};

const calculateHolidayEligibleTotal = (
  products: ProductInfo[],
  customerLocation: "US" | "EU" | "ASIA"
): number => {
  let eligibleTotal = 0;

  for (const product of products) {
    if (
      product.category &&
      HOLIDAY_ELIGIBLE_CATEGORIES.includes(product.category.toLowerCase())
    ) {
      eligibleTotal += product.price * product.quantity;
    }
  }

  if (customerLocation === "EU") {
    eligibleTotal = eligibleTotal * 1.15;
  } else if (customerLocation === "ASIA") {
    eligibleTotal = eligibleTotal * 0.95;
  }

  return eligibleTotal;
};

const calculateDiscount = (
  adjustedTotal: number,
  totalQuantity: number,
  orderDate: Date = new Date(),
  products: ProductInfo[] = [],
  customerLocation: "US" | "EU" | "ASIA" = "US"
): DiscountResult => {
  const discounts: DiscountResult[] = [];

  const volumeDiscount = calculateVolumeDiscount(totalQuantity);
  if (volumeDiscount > 0) {
    discounts.push({
      discountType: "volume",
      discountPercent: volumeDiscount,
      discountAmount: adjustedTotal * (volumeDiscount / 100),
    });
  }

  if (isBlackFriday(orderDate)) {
    discounts.push({
      discountType: "black_friday",
      discountPercent: 25,
      discountAmount: adjustedTotal * 0.25,
    });
  }

  if (isHoliday(orderDate)) {
    const holidayEligibleTotal = calculateHolidayEligibleTotal(
      products,
      customerLocation
    );
    if (holidayEligibleTotal > 0) {
      discounts.push({
        discountType: "holiday",
        discountPercent: 15,
        discountAmount: holidayEligibleTotal * 0.15,
      });
    }
  }

  if (discounts.length === 0) {
    return {
      discountType: "none",
      discountPercent: 0,
      discountAmount: 0,
    };
  }

  const highestDiscount = discounts.reduce((max, current) =>
    current.discountAmount > max.discountAmount ? current : max
  );

  return highestDiscount;
};

export const calculateOrderTotal = (
  baseTotal: number,
  totalQuantity: number,
  customerLocation: "US" | "EU" | "ASIA",
  orderDate: Date = new Date(),
  products: ProductInfo[] = []
): {
  subtotal: number;
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  total: number;
} => {
  let subtotal = baseTotal;

  if (customerLocation === "EU") {
    subtotal = baseTotal * 1.15;
  } else if (customerLocation === "ASIA") {
    subtotal = baseTotal * 0.95;
  }

  const discount = calculateDiscount(
    subtotal,
    totalQuantity,
    orderDate,
    products,
    customerLocation
  );

  const total = subtotal - discount.discountAmount;

  return {
    subtotal,
    discountType: discount.discountType,
    discountPercent: discount.discountPercent,
    discountAmount: discount.discountAmount,
    total: Math.max(0, total),
  };
};
