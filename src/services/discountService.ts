import Holidays from "date-holidays";
import { DiscountType, CustomerLocation } from "../types";
import {
  DISCOUNT,
  LOCATION_PRICING,
  HOLIDAY_ELIGIBLE_CATEGORIES,
  HOLIDAY_COUNTRY_CODE,
  DATE,
} from "../constants";

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

const isBlackFriday = (date: Date): boolean => {
  const year = date.getFullYear();
  const lastDayOfNovember = new Date(year, DATE.DECEMBER, 0);
  let lastFriday = lastDayOfNovember;

  while (lastFriday.getDay() !== DATE.FRIDAY) {
    lastFriday = new Date(lastFriday.getTime() - DATE.MS_PER_DAY);
  }

  return (
    date.getMonth() === DATE.NOVEMBER && date.getDate() === lastFriday.getDate()
  );
};

const isPolishHoliday = (date: Date): boolean => {
  const holidays = new Holidays(HOLIDAY_COUNTRY_CODE);
  const yearHolidays = holidays.getHolidays(date.getFullYear());

  return yearHolidays.some((holiday) => {
    const holidayDate = new Date(holiday.date as string | Date);
    return (
      holidayDate.getMonth() === date.getMonth() &&
      holidayDate.getDate() === date.getDate()
    );
  });
};

const getLocationMultiplier = (location: CustomerLocation): number =>
  LOCATION_PRICING[location].MULTIPLIER;

const applyLocationPricing = (
  amount: number,
  location: CustomerLocation
): number => amount * getLocationMultiplier(location);

const calculateVolumeDiscountPercent = (totalQuantity: number): number => {
  const { TIER_3, TIER_2, TIER_1 } = DISCOUNT.VOLUME;

  if (totalQuantity >= TIER_3.MIN_QUANTITY) return TIER_3.PERCENT;
  if (totalQuantity >= TIER_2.MIN_QUANTITY) return TIER_2.PERCENT;
  if (totalQuantity >= TIER_1.MIN_QUANTITY) return TIER_1.PERCENT;

  return 0;
};

const calculateHolidayEligibleTotal = (
  products: ProductInfo[],
  customerLocation: CustomerLocation
): number => {
  const eligibleCategories = HOLIDAY_ELIGIBLE_CATEGORIES.map((c) =>
    c.toLowerCase()
  );

  const eligibleTotal = products
    .filter(
      (product) =>
        product.category &&
        eligibleCategories.includes(product.category.toLowerCase())
    )
    .reduce((sum, product) => sum + product.price * product.quantity, 0);

  return applyLocationPricing(eligibleTotal, customerLocation);
};

const calculateBestDiscount = (
  adjustedTotal: number,
  totalQuantity: number,
  orderDate: Date,
  products: ProductInfo[],
  customerLocation: CustomerLocation
): DiscountResult => {
  const discounts: DiscountResult[] = [];

  const volumePercent = calculateVolumeDiscountPercent(totalQuantity);
  if (volumePercent > 0) {
    discounts.push({
      discountType: "volume",
      discountPercent: volumePercent,
      discountAmount: adjustedTotal * (volumePercent / 100),
    });
  }

  if (isBlackFriday(orderDate)) {
    const blackFridayPercent = DISCOUNT.BLACK_FRIDAY.PERCENT;
    discounts.push({
      discountType: "black_friday",
      discountPercent: blackFridayPercent,
      discountAmount: adjustedTotal * (blackFridayPercent / 100),
    });
  }

  if (isPolishHoliday(orderDate)) {
    const holidayEligibleTotal = calculateHolidayEligibleTotal(
      products,
      customerLocation
    );
    if (holidayEligibleTotal > 0) {
      const holidayPercent = DISCOUNT.HOLIDAY.PERCENT;
      discounts.push({
        discountType: "holiday",
        discountPercent: holidayPercent,
        discountAmount: holidayEligibleTotal * (holidayPercent / 100),
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

  return discounts.reduce((best, current) =>
    current.discountAmount > best.discountAmount ? current : best
  );
};

export const calculateOrderTotal = (
  baseTotal: number,
  totalQuantity: number,
  customerLocation: CustomerLocation,
  orderDate: Date = new Date(),
  products: ProductInfo[] = []
): {
  subtotal: number;
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  total: number;
} => {
  const subtotal = applyLocationPricing(baseTotal, customerLocation);

  const discount = calculateBestDiscount(
    subtotal,
    totalQuantity,
    orderDate,
    products,
    customerLocation
  );

  const total = Math.max(0, subtotal - discount.discountAmount);

  return {
    subtotal,
    discountType: discount.discountType,
    discountPercent: discount.discountPercent,
    discountAmount: discount.discountAmount,
    total,
  };
};
