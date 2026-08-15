# CinemaLIK 🎬

A state-of-the-art, full-stack real-time cinema seat-booking web application, custom-architected for high concurrency and secure session handling.

CinemaLIK lets users browse live movies sourced via a server-side proxy from The Movie Database (TMDB), select screenings, select seats dynamically on an interactive theatre map, and confirm reservations. To deliver an exceptional user experience, seat status (available, locked, confirmed) synchronizes in real time across all concurrent users utilizing a robust WebSocket architecture and transaction-isolated database locks.

---

## 📋 Table of Contents

- [🛠️ CV Technical Highlights (Resume Ready)](#️-cv-technical-highlights-resume-ready)
- [💻 Tech Stack](#-tech-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [✨ Core Features](#-core-features)
- [📁 Project Structure](#-project-structure)
- [⚙️ Database Schema & Models](#️-database-schema--models)
- [🚀 Getting Started](#-getting-started)
- [🌐 Environment Variables](#-environment-variables)
- [🔌 API Reference](#-api-reference)
- [📡 WebSocket Event Gateway](#-websocket-event-gateway)
- [🔒 Authentication & Security Protocols](#-authentication--security-protocols)
- [📈 Roadmap](#-roadmap)

---

## 🛠️ CV Technical Highlights (Resume Ready)

Below are key professional highlights and engineering achievements from this project that you can copy and paste directly into your CV/Resume:

### **Core Competencies & Achievements**
* **Real-Time Data Synchronization**: Designed and implemented a bidirectional event-driven communication layer using **Socket.IO** rooms to broadcast screening-specific seat locks and confirmations to all active clients, keeping UI state reactive without polling.
* **Concurrency Control & Atomic Transactions**: Built an isolated booking system with **Prisma ORM** `$transaction` blocks. Leveraged conditional write assertions (`updateMany` count verification) in **PostgreSQL** to prevent race conditions and double bookings under concurrent booking requests.
* **Advanced Axios Request Queueing**: Engineered a custom token refresh interceptor using **Axios** that handles access token expiration transparently. Replays pending client calls and queues concurrent requests under a single refresh-token exchange to eliminate duplicate token generation loops.
* **Secure Session Management & Rotation**: Implemented a security-first authentication system using short-lived JWT access tokens and long-lived **HttpOnly, SameSite, Secure** refresh tokens. Features automatic Refresh Token Rotation (RTR) with database-backed session revocation.
* **Automated Background Job Scheduling**: Integrated **NestJS Schedule** to run minute-by-minute cron sweeps (`LockExpiryCron`) that identify and release stale database-level seat locks (5-minute expiration) and broadcast the released seats back to active clients.
* **API Gateway & Data Normalization**: Developed a secure server-side proxy module for the external TMDB API using NestJS **HttpService (RxJS)**, encapsulating API credentials, caching core movie entities, and normalizing payloads to a standard JSON API schema.

---

## 💻 Tech Stack

### **Backend Framework & Services**
* **Framework**: [NestJS 11](https://nestjs.com/) (TypeScript, Modular Architecture, Dependency Injection)
* **Database**: PostgreSQL (Structured Relational Store)
* **ORM**: [Prisma 7](https://www.prisma.io/) (with `@prisma/adapter-pg` driver adapter)
* **Real-time Engine**: Socket.IO via `@nestjs/websockets`
* **Task Scheduler**: `@nestjs/schedule` (for Cron-based background sweeps)
* **Security & Auth**: Passport (`passport-jwt`), JSON Web Tokens (JWT), `bcrypt` (password hashing), Express `cookie-parser`
* **Validation**: `class-validator` and `class-transformer` (for type-safe DTO incoming payload validation)

### **Frontend Client**
* **Framework**: React 19 + TypeScript (Single Page Application)
* **Build System**: Vite (Fast HMR and Optimized Production Bundles)
* **Routing**: React Router v7 (Client-side routing with Guarded/Protected Routes)
* **Styling**: Tailwind CSS v4 (Leveraging native CSS `@theme` variables for bespoke aesthetics)
* **HTTP Client**: Axios (Custom instance with pre-configured request interceptors and token-refresh queueing)
* **WebSockets**: `socket.io-client`

---

## 🏗️ System Architecture

```
┌──────────────────────┐         REST (JSON)          ┌──────────────────────┐
│                      │ ───────────────────────────► │                      │
│   React + Vite SPA   │                              │    NestJS backend    │
│      (port 5173)     │ ◄─────────────────────────── │      (port 3000)     │
│                      │      Socket.IO (rooms)       │                      │
└──────────────────────┘                              └───────┬──────────────┘
                                                              │
                                              ┌───────────────┴───────────────┐
                                              │                               │
                                         ┌────▼─────┐                  ┌──────▼──────┐
                                         │ Postgres │                  │  TMDB API   │
                                         │ (Prisma) │                  │  (movies)   │
                                         └──────────┘                  └─────────────┘
```

The system separates concerns through a modular backend structure:
* **`auth`**: Handles register, login, session refresh, token rotation, and cookie-based revocation.
* **`users`**: Controls user profile retrieval and persistence.
* **`movies`**: Serves as a secure proxy to the TMDB API, stripping key details and mapping payloads to cleaner formats.
* **`booking`**: Orchestrates database transactions, seat bookings, and runs the Socket.IO event gateway.
* **`prisma`**: Contains the injectable `PrismaService` connected database-wide.

---

## ✨ Core Features

* **Real-Time Seat Booking Map**:
  - Cinema seating layout rendered dynamically by row (`A` through `H`) and seat number (1-12), split down the middle by a virtual central aisle.
  - Active WebSocket connections keep the seat grid synchronized across everyone viewing the same screening.
* **Optimistic Locking with 5-Minute Sweep**:
  - Selecting a seat locks it for 5 minutes (state: `LOCKED`).
  - Stale seat locks are automatically cleared via a scheduled backend cron sweep every minute, returning unclaimed seats back to `AVAILABLE`.
  - Seat locks are released immediately if a user disconnects mid-selection.
* **Transparent Token Refresh Queueing**:
  - Short-lived access tokens (15m) and HTTP-Only refresh cookies (7d).
  - If multiple API requests fail with `401 Unauthorized` simultaneously, the Axios interceptor queues subsequent requests, initiates a single refresh call, updates the JWT token, and replays all queued requests seamlessly.
* **Database Concurrency Isolation**:
  - Utilizes PostgreSQL query transactions to check, lock, and verify seat counts during checkout. If another user books a seat first, the transaction rolls back, throwing a `409 Conflict`.
* **Now Showing Catalogue with Endless Pagination**:
  - Popular films grid with title, rating, poster, and overview descriptions.
  - "Load More" pagination updates state and appends the next page of TMDB-discover results dynamically.
* **Custom Marquee Cinema Palette Theme**:
  - Styled utilizing Tailwind CSS v4 `@theme` tokens, creating an immersive, premium, art-deco aesthetic with deep dark backgrounds (`#0B0B0D`), custom marquees (`Bebas Neue`), and ticket-stub visual components.

---

## 📁 Project Structure

```
CinemaLIK/
├── backend/                        # NestJS API Engine
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma Data Model Configuration
│   │   └── migrations/             # SQL Migrations for Schema Evolution
│   ├── src/
│   │   ├── auth/                   # Auth routes, JWT guards & cookie configuration
│   │   ├── users/                  # User persistence & endpoint handlers
│   │   ├── movies/                 # Server-side TMDB API Proxy service
│   │   ├── booking/                # Reservation service, transactions & lock logic
│   │   │   ├── booking-gateway/    # Socket.IO WebSocket gateway & event emitters
│   │   │   └── lock-expiry.cron.ts # Minute-by-minute Cron sweep scheduling
│   │   ├── prisma/                 # PrismaService Injection
│   │   └── main.ts                 # CORS, Cookie Parsing, global Pipes bootstrap
│   └── prisma.config.ts
│
└── frontend/                       # React Single Page Application (SPA)
    └── src/
        ├── api/client.tsx          # Axios Instance + Concurrent Request Refresh Interceptors
        ├── socket.ts               # Socket.IO client instance wrapper
        ├── components/             # Reusable UI Blocks (Forms, Protected Routes)
        ├── pages/                  # Views (Authentication, Movies Home, Reservation, Confirmation)
        ├── assets/                 # Image collages & static assets
        └── index.css               # Bespoke Tailwind CSS v4 design theme & styling variables
```

---

## ⚙️ Database Schema & Models

```
Movie ──< Screening ──< Seat
              │           │
User ──< Booking ─────────┘
```

| Model | Table Name | Purpose |
|---|---|---|
| **User** | `User` | Stores `email` (unique), `name`, `password_hash` (bcrypt), and the hashed `refresh_token` signature. |
| **Movie** | `movies` | Cached film records (`id`, `title`, `poster`, `rating`, `duration`) matching TMDB references. |
| **Screening** | `screenings` | Instances of a movie showtime (`movieId`, `startsAt`, ticket `price`). |
| **Seat** | `seats` | Represents specific coordinates (`row`, `number`) linked to a screening, maintaining state (`AVAILABLE`, `LOCKED`, `CONFIRMED`) and unique constraints on `(screeningId, row, number)`. |
| **Booking** | `bookings` | Links a `User` to a `Screening` with transaction total details and timestamp. |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v20 or later
* **PostgreSQL**: Local or hosted database instance
* **TMDB API Key**: Free key from [The Movie Database API settings](https://www.themoviedb.org/settings/api)

### 1. Clone the repository
```bash
git clone git@github.com:amarouf-dev/CinemaLIK.git
cd CinemaLIK
```

### 2. Configure & Run Backend
```bash
cd backend
npm install
cp .env.example .env        # Add your DATABASE_URL, secrets, and MOVIES_API_KEY

npx prisma generate         # Generate localized Prisma Client
npx prisma migrate dev      # Synchronize database schemas & tables
npm run start:dev           # Run NestJS in Development Watch Mode (http://localhost:3000)
```

### 3. Configure & Run Frontend
```bash
cd ../frontend
npm install
cp .env.example .env        # Set VITE_BACKEND_URL=http://localhost:3000
npm run dev                 # Start Vite Dev Server (http://localhost:5173)
```

---

## 🌐 Environment Variables

### **Backend (`backend/.env`)**
* `DATABASE_URL`: PostgreSQL Connection String (e.g. `postgresql://postgres:pwd@localhost:5432/cinemalik`)
* `ACCESS_TOKEN`: Encryption key for short-lived access JWT tokens
* `REFRESH_TOKEN`: Encryption key for long-lived refresh JWT tokens
* `MOVIES_API_KEY`: API Key for query authentication to TMDB
* `PORT`: Server port (defaults to `3000`)
* `NODE_ENV`: Set to `production` to enforce secure cookies (HttpOnly + Secure + Lax)

### **Frontend (`frontend/.env`)**
* `VITE_BACKEND_URL`: Destination URL pointing to the NestJS server instance (`http://localhost:3000`)

---

## 🔌 API Reference

### **Authentication Module**
* `POST /auth/register` - Registers a new user account. Issues JWT access token & sets HTTP-Only cookie.
* `POST /auth/login` - Authenticates credentials. Issues JWT access token & sets HTTP-Only cookie.
* `POST /auth/refresh` - Reads HTTP-Only cookie, performs rotation validation, and issues a new access token.
* `POST /auth/logout` - Clears cookie and invalidates the refresh token record in the database.

### **Users Module**
* `GET /users/me` [Guarded] - Returns email and name details of the authenticated requester.

### **Movies Catalogue Module**
* `GET /movies/popular?page=X` - Returns paginated, normalized movie listings.
* `GET /movies/:id` - Fetches specific movie metadata including duration (mins) and genres.

### **Bookings Module**
* `GET /bookings/screening?movieId=X&startsAt=Y` [Guarded] - Resolves showtimes to a screening database record. Automatically provisions the movie and seats grid if requested for the first time.
* `POST /bookings` [Guarded] - Submits a seat booking transaction. Body: `{ screeningId, seats[], socketId? }`.
* `GET /bookings/:id` [Guarded] - Retrieves booking details. Scoped to the authenticated owner.

---

## 📡 WebSocket Event Gateway

Real-time seat mapping is managed using rooms keyed by the **Screening ID**.

| Direction | Event Name | Payload | Description |
|---|---|---|---|
| Client ➔ Server | `join-room` | `screeningId` | Subscribes socket to the screening room. |
| Client ➔ Server | `seat:lock` | `{ seatId, screeningId }` | Holds a seat for 5 minutes. |
| Client ➔ Server | `seat:unlock` | `{ seatId, screeningId }` | Releases a seat before booking completion. |
| Server ➔ Client | `seats:init` | `Seat[][]` | Sent on joining; initialization map grouped by row. |
| Server ➔ Room | `seat:updated` | `{ seatId, status }` | Broadcasts seat status change (`AVAILABLE`, `LOCKED`, `CONFIRMED`). |
| Server ➔ Client | `seat:lock-failed`| `{ seatId, reason }` | Sent if the seat was claimed before the socket request processed. |

---

## 🔒 Authentication & Security Protocols

1. **Dual-Token Lifecycle**: Authentication splits credentials into low-durability (15 minutes) bearer tokens for API requests and highly-durable (7 days) refresh tokens to manage long-term sessions.
2. **Rotating Refresh Keys (RTR)**: Successful refresh transactions invalidate the old refresh token database signature and issue a fresh pair. Re-use of any previously invalidated refresh token immediately flags the session as compromised and revokes all active tokens for that user.
3. **Storage Isolation**: Access tokens are kept in JavaScript memory, while refresh tokens are confined to HTTP-Only cookies, preventing data-harvesting scripts (XSS attacks) from reading them.
4. **CORS Restrictions**: Both backend and WebSocket configurations are bound to valid client origins (e.g. `http://localhost:5173`), preventing unauthorized cross-origin requests.

---
