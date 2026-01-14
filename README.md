# Venue Management System API

A comprehensive and scalable backend API for managing sports venues, court bookings, dynamical pricing, and payment processing. Built with performance and best practices in mind using **NestJS**.

## 🚀 Features

- **User Authentication & Authorization**:
  - Secure JWT-based authentication (Access & Refresh Tokens).
  - Role-Based Access Control (RBAC): `ADMIN`, `MANAGER`, `CUSTOMER`.
  - Email verification and password reset flows.
- **Venue & Court Management**:
  - Configure operating hours and slot durations (e.g., 30 mins, 60 mins).
  - Manage multiple courts with different types (Std, Premium).
  - **Dynamic Pricing Engine**: Set pricing rules based on time of day, court type, or specific dates.
- **Smart Booking System**:
  - Real-time availability checking with high-performance algorithms.
  - Conflict detection and booking validation.
  - Support for group bookings and recurring schedules.
- **Payment Integration**:
  - Integrated with **PayOS** for seamless checkout.
  - Webhook handling for automatic payment status updates.
- **High-Performance Statistics**:
  - Optimized SQL queries for reporting (Occupancy rates, Revenue).
  - Capable of handling millions of records with sub-second response times.
- **Reporting**:
  - Export daily/monthly booking reports to Excel.
- **DevOps Ready**:
  - **Docker & Docker Compose** setup for one-click deployment.
  - **Caddy** integration for automatic HTTPS handling in production.

## 🛠️ Tech Stack

- **Core Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Caching/Rate Limiting**: NestJS Throttler
- **Logging**: Winston
- **Email**: Brevo (formerly Sendinblue)
- **Payment**: PayOS
- **Containerization**: Docker, Docker Compose

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v15+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Optional, for containerized run)

## ⚡ Quick Start

### Option 1: Running with Docker (Recommended)

This gives you a fully functional environment (API + Database + HTTPS Proxy) in one command.

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/venue-management-system-api.git
    cd venue-management-system-api
    ```

2.  **Environment Setup**:
    Copy the example env file in `server` folder.

    ```bash
    cp server/.env.example server/.env
    ```

    _Update the `.env` file with your credentials (SMTP, PayOS keys, etc.)._

3.  **Start the application**:
    ```bash
    docker-compose up -d --build
    ```
    The API will be available at `http://localhost:3001` (or your configured port).
    Database is accessible via port `5432`.

### Option 2: Running Locally

1.  **Install Dependencies**:

    ```bash
    cd server
    npm install
    ```

2.  **Database Setup**:
    Ensure you have a PostgreSQL instance running locally. Update `server/.env` with your DB credentials.

3.  **Run Migrations & Seed Data**:

    ```bash
    # Run initial seed (Users, Venue Config, Courts)
    npm run seed:run
    ```

4.  **Start the Server**:
    ```bash
    npm run start:dev
    ```

## 📚 API Documentation

Once the server is running, you can access the interactive Swagger documentation at:

```
http://localhost:3001/api/v1/docs
```

## 🧪 Testing & Seeding

### Seeding Data

- **Initial Data**: Creates default admin, managers, courts, and operating hours.
  ```bash
  npm run seed:run
  ```
- **Big Data (Stress Test)**: Generates 1,000,000 booking records for performance testing.
  ```bash
  npm run seed:big
  ```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔑 Environment Variables

Key variables in `.env`:

| Variable                 | Description                                   | Default                                 |
| :----------------------- | :-------------------------------------------- | :-------------------------------------- |
| `APP_ENV`                | Environment mode (`development`/`production`) | `development`                           |
| `DB_HOST`                | Database host                                 | `localhost` (use `postgres` for Docker) |
| `DB_PASSWORD`            | Database password                             | -                                       |
| `AUTH_JWT_ACCESS_SECRET` | Secret for Access Token                       | -                                       |
| `SMTP_API_KEY`           | API Key for Brevo Email Service               | -                                       |
| `PAYMENT_CLIENT_ID`      | PayOS Client ID                               | -                                       |
| `PAYMENT_API_KEY`        | PayOS API Key                                 | -                                       |
| `PAYMENT_CHECKSUM_KEY`   | PayOS Checksum Key                            | -                                       |

## 📂 Project Structure

```
├── docker-compose.yml       # Local development orchestration
├── docker-compose.prod.yml  # Production orchestration (with Caddy)
└── server
    ├── src
    │   ├── common           # Shared decorators, guards, filters, interceptors
    │   ├── config           # Configuration loaders
    │   ├── database         # Migrations and Seeds
    │   ├── modules          # Feature modules (Auth, User, Booking, Court, etc.)
    │   └── providers        # External services (Smtp, Logger)
    ├── test                 # E2E Tests
    └── Dockerfile           # Docker build instructions
```

## 📄 License

This project is UNLICENSED.
