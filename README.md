# BloodLink — Smart Blood Donor Connectivity Platform

A complete MERN stack application for connecting blood donors with requesters in real-time.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Redux Toolkit + RTK Query, React Router v6, Framer Motion, Recharts, Mapbox GL JS |
| **Backend** | Node.js, Express.js, MongoDB + Mongoose, Redis, BullMQ, Socket.io, JWT |
| **Notifications** | Nodemailer (SMTP), Twilio (SMS/WhatsApp), Socket.io (in-app) |
| **Reports** | PDFKit, ExcelJS |
| **Uploads** | Cloudinary + Multer |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, graceful fallback)

### Setup

```bash
# 1. Clone and copy env
cp .env.example server/.env

# 2. Start Redis (Required for background jobs & rate limiting)
# Open a PowerShell terminal in the project root and run:
Start-Process -FilePath ".\redis-bin\redis-server.exe" -WindowStyle Hidden

# 3. Install & start server (in a new terminal)
cd server
npm install
npm run dev

# 4. Install & start client (new terminal)
cd client
npm install
npm run dev
```

Server runs on `http://localhost:5000`, client on `http://localhost:5173`.

## Architecture

```
blood-connect/
├── server/                  # Express.js API
│   ├── config/             # DB, Redis, Cloudinary, Twilio, Mailer, Queue
│   ├── modules/
│   │   ├── auth/           # Register, login, OTP, JWT, refresh
│   │   ├── user/           # Profile, location, avatar
│   │   ├── donor/          # Availability, verification, badges
│   │   ├── request/        # Blood request lifecycle
│   │   ├── hospital/       # License, inventory, donor verification
│   │   ├── admin/          # CRUD, analytics, reports, broadcast
│   │   ├── notification/   # Multi-channel dispatch
│   │   ├── feedback/       # Ratings, trust score
│   │   └── location/       # Reverse geocoding
│   ├── jobs/               # BullMQ workers
│   ├── sockets/            # Socket.io handlers
│   ├── middlewares/        # Auth, roles, rate-limit, upload, errors
│   └── utils/              # Response helpers, JWT, haversine
├── client/                  # React + Vite
│   └── src/
│       ├── app/            # Redux store, RTK Query
│       ├── hooks/          # useAuth, useSocket, useGeolocation
│       ├── layouts/        # AuthLayout, DashboardLayout
│       ├── modules/        # auth, donor, requester, hospital, admin
│       └── pages/          # Landing, Notifications, 404
└── .env.example
```

## User Roles

| Role | Capabilities |
|------|-------------|
| **Donor** | Register, upload cert, toggle availability, track streaks & badges |
| **Requester** | Create blood requests, track donors live, view history |
| **Hospital** | Verify donors, manage blood inventory, bulk requests |
| **Admin** | Manage users, analytics dashboard, emergency broadcast, reports |

## API Endpoints

All responses use `{ success, message, data, pagination? }` envelope.

- `POST /api/auth/register|login|verify-otp|refresh|logout|forgot-password|reset-password`
- `GET|PUT /api/users/me` · `PUT /api/users/me/location` · `POST /api/users/me/avatar`
- `GET|PUT /api/donor/profile|availability|dashboard` · `POST /api/donor/upload-certificate`
- `POST /api/requests` · `GET /api/requests/:id|my` · `POST /api/requests/:id/accept|complete`
- `GET|PUT /api/hospital/profile|inventory` · `POST /api/hospital/requests/bulk`
- `GET|PUT|DELETE /api/admin/users/:id` · `POST /api/admin/broadcast` · `GET /api/admin/analytics|reports`
- `GET /api/notifications` · `PUT /api/notifications/:id/read|read-all`
- `POST /api/feedback` · `GET /api/feedback/user/:id`

## Real-Time Events

Socket.io events for live tracking, request notifications, and emergency broadcasts.

## License

MIT
