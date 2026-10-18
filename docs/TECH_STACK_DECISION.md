# Technology Stack Decision & Architecture Evaluation

**Document Version:** 1.0.0  
**Project:** BloodLink Rebuild  
**Architect:** Senior Full-Stack & DevOps Architect  

---

## 1. Executive Summary & Stack Recommendation

Following the thorough audit of `a:\Projects\blood-donor`, the existing custom Node/Express/MongoDB/Redis stack suffers from critical failure points:
- Tight coupling to external services (Twilio, Mapbox) that crash the server if credentials are missing.
- Local dependency on unmanaged Redis and MongoDB daemons.
- Data schema desynchronization between user accounts and donor profiles.
- Absence of relational constraints, causing vulnerability to race conditions during blood request fulfillment.

To achieve maximum reliability, zero operational overhead on developer machines, healthcare-grade privacy with Row Level Security (RLS), and a world-class UI, we evaluated three viable architectural stacks.

### **Selected Target Stack (Option 1 - Strongly Recommended):**
- **Frontend:** React 18/19 + TypeScript + Vite + Tailwind CSS + shadcn/ui component primitives + React Router + React Hook Form + Zod + Lucide React.
- **Backend & Database:** PostgreSQL via Supabase (or self-hosted Postgres) with Row Level Security (RLS), Supabase Auth (or JWT fallback), PostGIS spatial functions, and Realtime event subscriptions.
- **Mapping & Location:** Leaflet + OpenStreetMap tiles with PostGIS / Turf.js distance calculations (no costly Mapbox token dependencies).
- **Testing:** Vitest + React Testing Library + Playwright E2E.
- **Deployment:** Vercel / Netlify (Frontend) + Supabase (Backend/Database) + GitHub Actions CI/CD.

---

## 2. In-Depth Comparison of 3 Viable Technology Stacks

### Stack Option 1: Modern React + TypeScript + Vite + Supabase (PostgreSQL) + Leaflet *(Recommended)*
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + React Hook Form + Zod
- **Backend:** PostgreSQL + Supabase Auth + Row Level Security (RLS) + PostGIS + Supabase Realtime
- **Location:** Leaflet + OpenStreetMap tiles (Zero API key dependency)
- **Testing & CI:** Vitest + React Testing Library + Playwright + GitHub Actions

#### Strengths:
1. **Rock-Solid Relational Integrity:** Enforces ACID transactions for blood request fulfillment. Eliminates split-brain donor records via foreign key relationships and PostgreSQL check constraints.
2. **Built-in Healthcare-Grade Privacy (RLS):** Donor contact numbers and exact coordinates are protected at the database engine level via Row Level Security policies. Even if a client queries the database, private contact info is only accessible to authorized requesters of an accepted request.
3. **Native Real-Time Without Dedicated WebSocket Server:** Supabase Realtime broadcasts database changes (new urgent requests, status changes) directly over WebSockets without maintaining and scaling a stateful Node.js Socket.io server.
4. **Geographic Precision with PostGIS:** Native SQL spatial queries (`ST_DWithin`, `ST_Distance`) allow querying donors within a precise radius (e.g., 20 km) with zero external geocoding latency.
5. **Generous Free Tier:** Supabase includes 500 MB database, 50,000 monthly active users, 5 GB storage, and 500k edge invocations per month completely free. Vercel provides free global CDN hosting.
6. **Local Developer Experience:** Can be run with local Supabase CLI (Docker) or connected directly to a free remote project, removing local Redis/Mongo setup friction.

#### Limitations & Mitigations:
- *Postgres Schema Migrations:* Must be managed via versioned SQL migration scripts. *Mitigation:* We will store all migrations in `supabase/migrations/` and provide a reproducible local setup.
- *Vendor Lock-In:* Supabase is open-source (standard PostgreSQL); if needed, it can be hosted on AWS RDS or local Docker with standard pgvector/PostGIS.

---

### Stack Option 2: Refactored MERN Stack (React + Express + MongoDB Atlas + Redis Cloud + Socket.io)
- **Frontend:** React + JavaScript/TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js + Mongoose
- **Database & Cache:** MongoDB Atlas (M0 Free Tier) + Upstash Redis
- **Realtime & Location:** Socket.io + Leaflet

#### Evaluation:
- **Pros:** Maintains familiar Express route structure from the original codebase; allows incremental refactoring.
- **Cons:**
  - MongoDB document model makes atomic request claims difficult; requires two-phase commits or heavy transactions.
  - Requires maintaining 3 separate operational servers/services: Express API host (e.g., Render/Railway), MongoDB Atlas cluster, and Redis Cloud instance for BullMQ queues.
  - Free tiers on Render/Railway sleep after inactivity, leading to 30-50 second cold starts during emergency blood requests.
  - Socket.io requires sticky sessions or Redis pub/sub adapters when scaled beyond 1 container.
- **Verdict:** Higher operational complexity, prone to server sleep latency, and higher maintenance burden.

---

### Stack Option 3: Full-Stack Next.js 15 (App Router + TypeScript + Prisma / PostgreSQL + NextAuth)
- **Frontend & Server:** Next.js 15 (React 19 Server Components + Server Actions)
- **Database:** PostgreSQL (Neon / Supabase) via Prisma ORM
- **Auth:** NextAuth (Auth.js v5)
- **Location:** Leaflet + OpenStreetMap

#### Evaluation:
- **Pros:** Single codebase for client and server; excellent SSR and SEO capabilities for public landing pages; type-safe database queries via Prisma.
- **Cons:**
  - Server Components and Next.js App Router have complex caching behaviors that can complicate real-time emergency notifications.
  - WebSockets (Socket.io) cannot run natively inside Vercel serverless functions without external services like Pusher or Ably.
  - Server Action overhead for rapid status updates (e.g. live donor tracking) is sluggish compared to direct client-side subscriptions.
- **Verdict:** Excellent for content-heavy or e-commerce apps, but sub-optimal for high-frequency real-time emergency signaling compared to Option 1.

---

## 3. Comprehensive Multi-Dimensional Comparison Matrix

| Evaluation Criteria | Option 1: React + Vite + Supabase (PostgreSQL) *(Selected)* | Option 2: Refactored MERN (Express + Mongo + Redis) | Option 3: Next.js 15 Full-Stack (Next.js + Prisma) |
| :--- | :--- | :--- | :--- |
| **Development Speed** | ⚡ **Very High** (instant auth, auto-generated CRUD, typed client) | 🐢 **Moderate** (custom Express boilerplate, validation middleware) | ⚡ **High** (unified framework, typed server actions) |
| **Hosting Cost (Production)** | 🟢 **$0/month** (Supabase Free Tier + Vercel Hobby) | 🟡 **$0 - $15/month** (Render/Railway free tiers sleep; upgrades required) | 🟢 **$0/month** (Vercel + Neon Free Tier) |
| **Database ACID & Locking** | 🟢 **Native PostgreSQL Transactions & Locks** (`FOR UPDATE`) | 🔴 **Document-level only**; complex multi-doc transactions | 🟢 **Native PostgreSQL via Prisma Transactions** |
| **Security & Privacy** | 🛡️ **Row Level Security (RLS) at DB Kernel** | ⚠️ **Application-level only** (one controller bug leaks data) | ⚠️ **Application-level ORM checks** |
| **Realtime Emergency Alerts** | 🟢 **Native Supabase Realtime (WebSockets)** | 🟡 **Self-managed Socket.io + Redis Adapter** | 🔴 **Requires 3rd party (Pusher/Ably) on Serverless** |
| **Geographic Search** | 🟢 **PostGIS / SQL Haversine Index** | 🟡 **MongoDB `$nearSphere` 2dsphere index** | 🟢 **PostGIS via raw SQL / Prisma extension** |
| **Map Licensing Costs** | 🟢 **$0 (Leaflet + OpenStreetMap)** | 🔴 **Mapbox usage tier limits / token failures** | 🟢 **$0 (Leaflet + OpenStreetMap)** |
| **Local Environment Simplicity**| 🟢 **Zero crash on missing keys; graceful dev mocks** | 🔴 **Crashes if Mongo/Redis/Twilio not active** | 🟢 **Local SQLite or remote Postgres connection** |
| **Production Maintainability** | 🟢 **High** (Standard Postgres, strong TypeScript types) | 🔴 **Low** (Decoupled microservices, Redis queues, Express) | 🟡 **Moderate** (App Router breaking changes) |

---

## 4. Final Decision Rationale

We formally select **Option 1 (React + TypeScript + Vite + Supabase PostgreSQL + Leaflet)** for the rebuild:
1. **Data Integrity:** Eliminates the split-brain bug between donors and users once and for all with a single normalized PostgreSQL schema.
2. **Reliable Emergency Matching:** PostGIS spatial queries allow finding compatible donors within X kilometers with mathematical precision.
3. **Real-time Without Server Maintenance:** Zero server-side process crashes from missing Redis daemons or third-party SDK top-level initializations.
4. **Donor Privacy Guaranteed:** Row Level Security policies guarantee donor identity and contact safety at the data layer.
5. **No API Paywalls:** Fully functional mapping with Leaflet and OpenStreetMap.

---

## 5. Free-Tier Quotas & Production Limits

| Service | Free Tier Allocation | BloodLink Production Impact |
| :--- | :--- | :--- |
| **Supabase Database** | 500 MB PostgreSQL storage, 2 projects | Sufficient for ~150,000 donor profiles and 500,000 blood requests. |
| **Supabase Auth** | 50,000 monthly active users (MAU) | Ample for municipal and regional donor networks. |
| **Supabase Storage** | 5 GB file storage, 2 GB bandwidth | Ample for >25,000 compressed medical certificates and ID proofs. |
| **Supabase Realtime** | 200 concurrent connections, 2M messages/month | Covers emergency room broadcast bursts easily. |
| **Vercel Hosting** | 100 GB bandwidth, unlimited deployments | Highly scalable global edge CDN for the React/Vite application. |
| **OpenStreetMap Tiles**| Standard OSM usage policy with client caching | 100% free; zero cost; no credit card required. |
