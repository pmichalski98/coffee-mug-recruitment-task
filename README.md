# How to Run

## Option 1: With Docker

### Prerequisites

- Docker
- Docker Compose

### Start the Application

From the project root directory:

```bash
docker compose up
```

This starts:

- MongoDB on port `27017`
- API server on port `3001`

## Running without Docker

### 1. Install dependencies

Using npm:

```bash
npm install
```

### 2. Start MongoDB

Make sure you have a MongoDB instance running.

### 3. Configure environment

Create a `.env` file in the project root:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/inventory-management
```

Adjust `MONGODB_URI` to match your MongoDB instance.

### 4. Start the server

Development mode (with hot reload):

```bash
npm run dev
```

## Running Tests

Tests use an in-memory MongoDB instance, no external database required.

```bash
npm test
```
