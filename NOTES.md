# Inventory Management System - Notes

## 1. Assumptions & Simplifications

### Key Assumptions

- **Customer entity pre-exists**: Orders require a valid `customerId`. Customers must be created directly in the database or via a separate seeding mechanism. No customer management endpoints were implemented as they weren't part of the requirements.

- **Product categories**: The `category` field on products is optional. Only products with `electronics` or `clothing` categories are eligible for holiday discounts.

- **Location model**: Customer location is stored as an enum (`US`, `EU`, `ASIA`) directly on the Customer entity, as specified in the task ("Location does not have to be fetched dynamically").

- **Black Friday calculation**: Black Friday is calculated as the last Friday of November, which aligns with the day after Thanksgiving (4th Thursday of November). Uses server timezone for date operations.

- **Polish holidays**: Holiday discounts use Polish bank holidays as the reference, implemented via the `date-holidays` library.

### Intentional Omissions

- **Authentication/Authorization**: Not implemented as it wasn't part of the requirements. In production, endpoints would be protected.

- **Pagination**: `GET /products` returns all products. For large datasets, pagination would be essential.

- **Customer CRUD endpoints**: Only the Customer model exists for order placement. No management endpoints were created.

- **Order retrieval endpoints**: Only `POST /orders` was required. `GET /orders` or `GET /orders/:id` could be added.

### Interpretation of Ambiguous Parts

- **"Discounts cannot be combined"**: Interpreted as applying only the single highest discount (by monetary value) when multiple discounts are eligible.

- **Holiday discount scope**: The 15% holiday discount applies only to products in eligible categories (`electronics`, `clothing`), not the entire order.

- **Location pricing vs discounts**: Location-based pricing (EU +15%, ASIA -5%) is applied as a price adjustment BEFORE discount calculation, not as a discount itself.

## 2. Technical Decisions

### Database Choice: MongoDB (Mongoose)

- **Reasoning**: MongoDB was chosen from the suggested options (lowdb, MongoDB) for its:

  - Native support for transactions (required for atomic stock updates)
  - Scalability for production use
  - Flexible schema for potential future extensions
  - Rich query capabilities

- **Trade-off**: More setup overhead compared to lowdb, but better suited for the transactional requirements of order processing.

### Project Structure

```
src/
├── commands/          # Command DTOs (write operations)
│   ├── orders/
│   └── products/
├── queries/           # Query DTOs (read operations)
│   └── products/
├── handlers/
│   ├── commandHandlers/   # Business logic for commands
│   └── queryHandlers/     # Business logic for queries
├── constants/         # Centralized constants
├── models/            # Mongoose schemas
├── routes/            # Express route definitions
├── services/          # Domain services (discountService)
├── validators/        # Zod validation schemas
├── middleware/        # Express middleware (validation, error handling)
├── types/             # TypeScript interfaces and shared types
└── utils/             # Utility functions
```

### CQRS Implementation

The CQRS (Command Query Responsibility Segregation) pattern separates read and write operations:

- **Commands** (`src/commands/`): DTOs representing write intentions (CreateProduct, SellProduct, RestockProduct, CreateOrder)
- **Queries** (`src/queries/`): DTOs representing read requests (GetProducts)
- **Command Handlers** (`src/handlers/commandHandlers/`): Execute business logic for state changes
- **Query Handlers** (`src/handlers/queryHandlers/`): Execute read-only operations

This separation:

- Makes the codebase more maintainable and testable
- Allows independent scaling of read/write operations in the future
- Clearly communicates intent through the type system

## 3. Business Logic

### Discount System

**Priority & Application Order:**

1. Calculate base total from product prices × quantities
2. Apply location-based pricing adjustment (EU +15%, ASIA -5%)
3. Calculate all eligible discounts:
   - Volume discount (5+ items: 10%, 10+ items: 20%, 50+ items: 30%)
   - Black Friday (25% on last Friday of November)
   - Holiday (15% on products in `electronics`/`clothing` categories during Polish holidays)
4. Apply ONLY the highest discount (by monetary value saved)

### Stock Consistency

- **Atomic transactions**: Order creation uses MongoDB sessions to ensure stock decrements and order creation are atomic
- **Pre-validation**: Stock availability is checked before any modifications
- **Rollback**: If any part of order creation fails, the entire transaction is rolled back
- **Optimistic approach**: Stock is checked and decremented in a single transaction to prevent race conditions

### Key Edge Cases Handled

- Orders with multiple products where one has insufficient stock are fully rejected
- Empty product arrays in orders are rejected
- Invalid MongoDB ObjectIds are caught at validation layer

## 4. Testing

### What is Covered

**Unit Tests** (`tests/unit/handlers/`):

- All command handlers (createProduct, sellProduct, restockProduct, createOrder)
- Query handlers (getProducts)
- Volume discount calculations
- Location-based pricing for all regions
- Insufficient stock scenarios
- Transaction rollback on failures

**Integration Tests** (`tests/integration/`):

- Products API: Full CRUD operations
- Validation error responses
- HTTP status codes verification
- Orders API: Order creation flow, stock updates, discount application

### What Would Be Required in Production

- **Load testing**: Concurrent order placement, stock race conditions

## 5. Trade-offs & Alternatives

### Decision: Discount Calculation in Application Layer

**What I chose**: Calculate discounts in `discountService.ts` using JavaScript/TypeScript.

**Alternative considered**: Store discount rules in the database with a rule engine pattern.

**Why I chose application layer**:

- Simpler implementation for the given requirements
- Easier to test (pure functions)
- No additional infrastructure needed
- Discount rules are relatively static

**Downsides**:

- Changing discount rules requires code deployment
- No admin interface for business users to modify discounts
- If rules become complex, the service could become hard to maintain

**Files affected**: `src/services/discountService.ts`, `src/handlers/commandHandlers/createOrderHandler.ts`

- **Timezone handling**: Date-based discount logic (Black Friday, holidays) uses server timezone. For international customers across US/EU/ASIA, this could cause edge cases where a customer's local date differs from server date. A production system might use UTC explicitly or customer-local timezones, but this was omitted as a business decision that would require explicit requirements.
