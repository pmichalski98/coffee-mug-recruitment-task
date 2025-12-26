export const VALIDATION = {
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 50,
  MONGODB_OBJECT_ID_REGEX: /^[0-9a-fA-F]{24}$/,
} as const;

export const DISCOUNT = {
  VOLUME: {
    TIER_1: { MIN_QUANTITY: 5, PERCENT: 10 },
    TIER_2: { MIN_QUANTITY: 10, PERCENT: 20 },
    TIER_3: { MIN_QUANTITY: 50, PERCENT: 30 },
  },
  BLACK_FRIDAY: { PERCENT: 25 },
  HOLIDAY: { PERCENT: 15 },
} as const;

export const LOCATION_PRICING = {
  US: { MULTIPLIER: 1.0 },
  EU: { MULTIPLIER: 1.15 },
  ASIA: { MULTIPLIER: 0.95 },
} as const;

export const HOLIDAY_ELIGIBLE_CATEGORIES = ["electronics", "clothing"] as const;

export const HOLIDAY_COUNTRY_CODE = "PL";

export const DATE = {
  NOVEMBER: 10,
  DECEMBER: 11,
  FRIDAY: 5,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
