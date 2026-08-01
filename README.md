# CinemaLIK

A full-stack cinema seat-booking application built as an end-of-studies internship project (PFE).

Users browse films pulled live from The Movie Database (TMDB), pick a showtime, choose their seats on an interactive seat map, and confirm a reservation. Seat availability is synchronised in real time between everyone viewing the same showing, so two people can never fight over the same seat without knowing it.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [API reference](#api-reference)
- [WebSocket events](#websocket-events)
- [Authentication flow](#authentication-flow)
- [Project status](#project-status)
- [Roadmap](#roadmap)

---

## Tech stack

**Backend**

| | |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) (TypeScript, modular architecture) |
| Database | PostgreSQL |
| ORM | [Prisma 7](https://www.prisma.io/) with the `@prisma/adapter-pg` driver adapter |
| Auth | JWT access tokens + rotating refresh tokens, Passport (`passport-jwt`), bcrypt |
| Real time | Socket.IO via `@nestjs/websockets` |
| External API | TMDB (The Movie Database) through `@nestjs/axios` |
| Validation | `class-validator` / `class-transformer` with a global `ValidationPipe` |

**Frontend**

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 (custom `@theme` design tokens — art-deco cinema palette) |
| HTTP | Axios, with a shared client that injects the access token and refreshes it transparently |
| Real time | `socket.io-client` |

---

## Architecture

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

The backend is split into feature modules, each owning its controller, service and DTOs:

- **`auth`** — registration, login, token issuance, refresh-token rotation, logout. Includes the Passport JWT strategy and the `JwtAuthGuard` reused across the app.
- **`users`** — user persistence and profile lookup.
- **`movies`** — a thin proxy over TMDB that normalises the upstream payload (poster URLs, genres, runtime) so the frontend never talks to TMDB directly and the API key stays server-side.
- **`booking`** — reservations and the Socket.IO gateway that broadcasts seat updates to everyone in a showing's room.
- **`prisma`** — a single injectable `PrismaService` extending `PrismaClient`, connected on module init.

Film metadata lives in TMDB, not in the database. Only the cinema's own domain — screenings, bookings, seats and users — is persisted, along with a thin `Movie` cache holding just enough (title, poster, rating, runtime) for a screening to reference a film without a round trip to TMDB.

---

## Features

- **Account management** — register and log in with email and password. Passwords are hashed with bcrypt and never leave the server.
- **Session handling** — short-lived JWT access tokens (15 min) paired with a 7-day refresh token stored in an `httpOnly` cookie. The refresh token is rotated on every use and its hash is kept in the database so sessions can be revoked server-side.
- **Film catalogue** — a paginated "Now Showing" grid backed by TMDB, with posters, ratings and synopses, plus a detail view exposing runtime and genres.
- **Booking flow** — pick a date, pick a showtime, select seats on a rendered auditorium layout (with a centre aisle and a screen indicator), and review a live order summary before confirming.
- **Real-time seat map** — clients join a Socket.IO room per showing, so seats taken by other users appear immediately without a refresh.
- **Themed UI** — a bespoke Tailwind theme (marquee typography, ticket-stub card, cinema palette) rather than a stock component library.

---

## Project structure

```
CinemaLIK/
├── backend/                        NestJS API
│   ├── prisma/
│   │   ├── schema.prisma           Data model
│   │   └── migrations/             Versioned SQL migrations
│   ├── src/
│   │   ├── auth/                   Register / login / refresh / logout
│   │   │   ├── dto/                Request validation schemas
│   │   │   ├── jwt/                Passport strategy + guard
│   │   │   └── types/              Typed authenticated request
│   │   ├── users/                  User persistence & profile
│   │   ├── movies/                 TMDB proxy
│   │   ├── booking/                Reservations
│   │   │   └── booking-gateway/    Socket.IO gateway
│   │   ├── prisma/                 PrismaService
│   │   └── main.ts                 Bootstrap, CORS, global pipes
│   └── prisma.config.ts
│
└── frontend/                       React SPA
    └── src/
        ├── api/client.tsx          Axios instance + auth interceptors
        ├── socket.ts               Socket.IO client
        ├── components/             Login / Register forms
        ├── pages/                  Auth, Home, Reservation
        ├── assets/
        └── index.css               Tailwind theme tokens
```

---

## Getting started

### Prerequisites

- Node.js 20 or later
- A running PostgreSQL instance
- A free [TMDB API key](https://www.themoviedb.org/settings/api)

### 1. Clone

```bash
git clone git@github.com:amarouf-dev/CinemaLIK.git
cd CinemaLIK
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in the values (see below)

npx prisma generate         # generates the client into backend/generated/
npx prisma migrate dev      # creates the schema in your database

npm run start:dev           # http://localhost:3000
```

> `prisma generate` is required before the first build — the Prisma client is emitted to `backend/generated/` and is not committed to the repository.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_BACKEND_URL=http://localhost:3000

npm run dev                 # http://localhost:5173
```

### Available scripts

**Backend** — `npm run start:dev` (watch mode) · `npm run build` · `npm run start:prod` · `npm test` · `npm run test:e2e` · `npm run lint` · `npm run format`

**Frontend** — `npm run dev` · `npm run build` · `npm run preview` · `npm run lint`

---

## Environment variables

**`backend/.env`**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/cinemalik` |
| `ACCESS_TOKEN` | Secret used to sign 15-minute access tokens |
| `REFRESH_TOKEN` | Secret used to sign 7-day refresh tokens (must differ from `ACCESS_TOKEN`) |
| `MOVIES_API_KEY` | TMDB API key |
| `PORT` | API port (defaults to `3000`) |
| `NODE_ENV` | Set to `production` to mark the refresh cookie `secure` |

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Base URL of the API, e.g. `http://localhost:3000` |

---

## Database

```
Movie ──< Screening ──< Seat
              │           │
User ──< Booking ─────────┘
```

| Model | Purpose |
|---|---|
| **User** | `id`, `email` (unique), `name`, `password_hash`, `refresh_token` (hashed) |
| **Movie** | Cached TMDB film (`id`, `title`, `poster`, `rating`, `duration`) — needed so a screening can reference a film |
| **Screening** | A showtime for a film: `movieId`, `startsAt`, `price` |
| **Booking** | Links a `User` to a `Screening`, with `totalPrice` and `createdAt` |
| **Seat** | A seat (`row`, `number`) in a screening, with a `status` of `AVAILABLE` / `LOCKED` / `CONFIRMED`, unique per `(screening, row, number)` |

Migrations live in `backend/prisma/migrations/` and are applied with `npx prisma migrate deploy` in production.

---

## API reference

Base URL: `http://localhost:3000`

### Auth

| Method | Route | Body | Description |
|---|---|---|---|
| `POST` | `/auth/register` | `{ name, email, password }` | Creates an account, returns an access token and sets the refresh cookie |
| `POST` | `/auth/login` | `{ email, password }` | Authenticates, returns an access token and sets the refresh cookie |
| `POST` | `/auth/refresh` | — (refresh cookie) | Rotates the refresh token and returns a new access token |
| `POST` | `/auth/logout` | — (refresh cookie) | Clears the cookie and revokes the stored refresh token |

Passwords must be at least 8 characters; the email is validated server-side.

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | Bearer | Returns the authenticated user's `email` and `name` |

### Movies

| Method | Route | Query | Description |
|---|---|---|---|
| `GET` | `/movies/popular` | `page` | Paginated catalogue: `id`, `title`, `overview`, `poster`, `rating` |
| `GET` | `/movies/:id` | — | Film detail, adding `duration` (minutes) and `genres` |

### Bookings

All booking routes require `Authorization: Bearer <accessToken>`.

| Method | Route | Query / Body | Description |
|---|---|---|---|
| `GET` | `/bookings/screening` | `movieId`, `startsAt` (ISO) | Resolves a film + showtime to a screening id, provisioning the screening and its seat grid on first request |
| `POST` | `/bookings` | `{ screeningId, seats[], socketId? }` | Confirms the selected seats and returns `{ id }` |
| `GET` | `/bookings/:id` | — | Booking detail, scoped to the authenticated owner |

Protected routes expect `Authorization: Bearer <accessToken>`.

---

## WebSocket events

The gateway is served from the same origin as the API. Clients join one room per **screening**, so broadcasts stay scoped to a single showtime.

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client → Server | `join-room` | `screeningId` | Subscribes the socket to a screening's room |
| Client → Server | `seat:lock` | `{ seatId, screeningId }` | Holds a seat for 5 minutes |
| Client → Server | `seat:unlock` | `{ seatId, screeningId }` | Releases a seat the socket holds |
| Server → Client | `seats:init` | `Seat[][]` | Full seat map, sent to the socket that just joined |
| Server → Room | `seat:updated` | `{ seatId, status }` | Any status change (`AVAILABLE` / `LOCKED` / `CONFIRMED`) |
| Server → Client | `seat:lock-failed` | `{ seatId, reason }` | The seat was claimed between click and emit |

Locks are released when the socket disconnects, and a cron sweep expires any that outlive their 5-minute window.

---

## Authentication flow

1. On register or login the API returns a **short-lived access token** in the response body and sets a **refresh token** in an `httpOnly`, `sameSite` cookie the JavaScript layer can never read.
2. The refresh token is hashed before being stored on the user row, so a database leak does not hand over usable sessions.
3. Every outgoing request is decorated with `Authorization: Bearer <token>` by an Axios request interceptor.
4. When a request comes back `401`, a response interceptor silently calls `/auth/refresh`, stores the new access token, and replays the original request — the user never sees the interruption.
5. Refresh tokens are **rotated**: each refresh issues a new pair and overwrites the stored hash, so a previously used token can no longer be redeemed.
6. Logout clears the cookie and nulls the stored hash, invalidating the session on the server rather than only in the browser.

---

## Project status

The application is a work in progress. What is implemented today:

- ✅ Registration, login, logout, token refresh and rotation
- ✅ Authenticated profile endpoint with a reusable JWT guard
- ✅ TMDB proxy — catalogue listing and film detail
- ✅ Full booking UI: date picker, showtime picker, seat map, order summary
- ✅ Prisma schema and migrations for users, movies, screenings, bookings and seats
- ✅ Booking endpoints — screening lookup, seat confirmation in a transaction, owner-scoped booking detail
- ✅ Real-time seat map — per-screening rooms, 5-minute seat locks, release on disconnect and on expiry
- ✅ Confirmation page and protected frontend routes

In progress:

- 🚧 **Screenings are provisioned on demand** — the UI offers any date/time, so a screening and its seat grid are created on first lookup rather than seeded from a real programme.
- 🚧 **Seat locks are tied to a socket id**, so refreshing the page during checkout leaves the user's own seats held until the 5-minute sweep clears them.
- 🚧 **Test coverage** — only the generated scaffolding exists.

---

## Roadmap

- Seed a real programme of screenings instead of provisioning them on demand, and add a uniqueness constraint on `(movieId, startsAt)`
- Tie seat locks to the user rather than the socket, so a page refresh keeps the selection
- "My reservations" history and booking cancellation
- Payment step in place of the flat ticket price
- Admin area for managing films and screenings
- Unit and end-to-end test coverage beyond the generated scaffolding

---

## Author

**Abdellah Marouf** — end-of-studies internship project (PFE).
