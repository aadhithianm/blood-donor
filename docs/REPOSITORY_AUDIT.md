# BloodLink Repository Audit & Technical Analysis

**Audit Date:** October 18, 2026  
**Auditor:** Senior Software Architect, Security & QA Engineering Team  
**Repository Path:** `a:\Projects\blood-donor`  
**Git Branch:** `main` (Up to date with `origin/main`)  
**Commit Baseline:** `2468813` (*docs: Enhance README with badges, features, and better structure*)  

---

## 1. Executive Summary

BloodLink is structured as a dual-repository Monorepo (`client/` and `server/`) intended as a comprehensive blood donor and hospital connectivity platform.

While the existing repository contains substantial boilerplate and modular folders for Auth, Donor, Requester, Hospital, and Admin capabilities, **the application is currently non-functional in a standard local environment**:
1. **Server Fatal Crash on Boot:** Starting the Node.js backend (`node server.js`) immediately crashes with `Error: accountSid must start with AC` because `server/config/twilio.js` executes top-level SDK instantiation using unconfigured environment variables.
2. **Missing Local Infrastructure:** MongoDB (port 27017) and Redis (port 6379) are not running on the local host. BullMQ queues and Mongoose fail immediately upon initialization.
3. **Severe Frontend Linting & Architecture Failures:** Running `npm run lint` in `client/` produces **92 problems (83 errors, 9 warnings)**, including components defined inside render bodies (violating React rules of hooks), React 19 compiler incompatibilities with React Hook Form, and pervasive unused code.
4. **Phantom Features & Missing Implementations:** Although `README.md` and dependencies advertise "Mapbox-powered map tracking," Mapbox is never imported into any UI component. Key requester and hospital routes merely mirror other views or display placeholder components.
5. **Data Architecture Split-Brain:** Donor availability and blood groups are redundantly stored in both `User` and `DonorProfile` models. Donor search algorithms query `User`, while profile updates modify `DonorProfile`, leading to desynchronization.

---

## 2. Environment & Repository Status

### 2.1 Git Status
- **Current Branch:** `main`
- **Remote:** `origin/main` (synced)
- **Working Tree:** Clean (uncommitted diff in `client/package-lock.json` contains platform-specific optional binary resolutions from npm install; user work preserved)
- **Recent Git History:**
  - `2468813`: *docs: Enhance README with badges, features, and better structure*
  - `c9e66bf`: *Initial commit: Professional MERN stack setup for BloodLink*

### 2.2 System & Tooling Verification
- **Operating System:** Windows 11
- **Node.js Version:** `v24.21.0`
- **npm Version:** `11.19.0`
- **MongoDB Service:** Not running on `127.0.0.1:27017` (TCP connection refused)
- **Redis Service:** Not running on `127.0.0.1:6379` (TCP connection refused)

---

## 3. Current Tech Stack Breakdown

### Frontend (`client/`)
| Component | Existing Specification | Current Reality & Issues |
| :--- | :--- | :--- |
| **Framework** | React 19 (`^19.2.4`) + Vite (`^8.0.1`) | Builds cleanly with Vite, but contains 92 ESLint errors and React 19 compiler warnings. |
| **CSS & Design** | Tailwind CSS 4 (`@tailwindcss/vite` `^4.2.2`) | Tailwind 4 integrated, but styling is inconsistent, heavily reliant on ad-hoc CSS classes and dark mode tokens that conflict. |
| **State Management** | Redux Toolkit (`^2.11.2`) + RTK Query | State slices defined for `auth` and `api`. Endpoints scattered across module folders. |
| **Form Handling** | React Hook Form (`^7.71.2`) + Zod (`^4.3.6`) | Form validation exists in registration and request modals, but hook calls trigger memoization warnings with React 19. |
| **Maps & Geo** | `mapbox-gl` (`^3.20.0`) | **Unused.** Listed in `package.json`, but never imported in any `.jsx` file. |
| **Realtime** | `socket.io-client` (`^4.8.3`) | Socket context wrapper implemented, but fails to connect without active server. |
| **Testing** | None | Zero tests (`vitest`, `jest`, or `playwright`) configured or written. |

### Backend (`server/`)
| Component | Existing Specification | Current Reality & Issues |
| :--- | :--- | :--- |
| **Runtime & HTTP** | Node.js 20+ ES Modules, Express (`^4.18.2`) | Modular routing in place (`/api/auth`, `/api/donor`, `/api/requests`, `/api/hospital`, `/api/admin`, `/api/feedback`, `/api/notifications`). |
| **Database** | MongoDB (`mongoose` `^8.0.0`) | Schema models defined. Lacks relational integrity, cascades, and transactional safety for request fulfillment. |
| **Job Queue & Cache** | Redis (`ioredis` `^5.3.2`) + BullMQ (`^5.1.0`) | 4 queues defined (`requestExpiry`, `donorReassign`, `otpCleanup`, `reportGeneration`). Blocks server when Redis is absent. |
| **Auth & Security** | JWT (`jsonwebtoken`), bcryptjs, Helmet, Rate Limit | Dual JWT scheme (access + refresh tokens). `password` and `passwordHash` co-exist in user schema. |
| **Third-Party APIs** | Twilio, Nodemailer, Cloudinary | Top-level initialization breaks server startup if credentials are empty or invalid. |
| **Testing** | None | Zero automated unit, integration, or API tests exist. |

---

## 4. Empirical Build and Runtime Verification Results

### 4.1 Client Build
```bash
> client@0.0.0 build
> vite build
✓ 3303 modules transformed.
✓ built in 3.67s
```
- **Result:** Vite generates `dist/` bundle (JavaScript bundle is `1,247 kB`, triggering Vite chunk size warnings).

### 4.2 Client Linting (`npm run lint`)
```bash
✖ 92 problems (83 errors, 9 warnings)
```
- **Key Failures:**
  - `react-hooks/static-components`: In `client/src/modules/auth/pages/RegisterPage.jsx:290`, `ToggleBtn` is declared inside render body, resetting input state on keystrokes.
  - `react-hooks/incompatible-library`: In `CreateRequestModal.jsx` and `CreateRequestPage.jsx`, `useForm().watch` conflicts with React Compiler memoization.
  - Pervasive `no-unused-vars`: Unused `motion`, `Icon`, `latitude`, `longitude`, `err` variables across almost all views.

### 4.3 Server Execution (`node server.js`)
```text
A:\Projects\blood-donor\server\node_modules\twilio\lib\base\BaseTwilio.js:71
                throw new Error("accountSid must start with AC" + apiKeyMsg);
                      ^
Error: accountSid must start with AC
    at new Client (A:\Projects\blood-donor\server\node_modules\twilio\lib\base\BaseTwilio.js:71:23)
    at file:///A:/Projects/blood-donor/server/config/twilio.js:3:16
```
- **Result:** Process terminates immediately (exit code 1). The server cannot start in any environment without valid Twilio production API keys.

---

## 5. Architectural Defects & Technical Debt

### 5.1 Redundant and Desynchronized Data Schema
- `User` schema contains `bloodGroup`, `availability` (boolean), `lastDonationDate`, `nextEligibleDate`.
- `DonorProfile` schema contains `bloodGroup`, `availability` (enum: `available | unavailable | on-cooldown`), `lastDonationDate`, `cooldownUntil`.
- In `server/modules/donor/donor.service.js`, `toggleAvailability` mutates `DonorProfile.availability`.
- In `server/modules/request/request.service.js`, `findMatchingDonors` queries `User.availability: true` and `User.bloodGroup`.
- **Impact:** When a donor marks themselves available or completes a donation, `findMatchingDonors` never reflects this state, causing missed alerts or invalid matches.

### 5.2 Concurrency and Race Conditions
- In `request.service.js`, fulfilling a request updates `unitsFulfilled` and accepts assignments without database transactions or atomic locks.
- Two donors accepting simultaneously can overfulfill a request beyond `unitsNeeded`.

### 5.3 Privacy & Healthcare Data Exposure
- The endpoint `POST /api/donor/nearby` and `GET /api/requests` expose exact coordinates (`coordinates: [lng, lat]`) and unmasked phone numbers directly in the JSON response to unverified clients.
- In a production healthcare platform, donor geolocation must be obfuscated (e.g., fuzzing coordinates or computing distances server-side) and donor phone numbers masked until a request is formally accepted and verified.

### 5.4 Hardcoded Routes & Missing Screens
- `/requester/dashboard` routes to `<RequestHistoryPage />`.
- `/requester/tracking` routes to `<CreateRequestPage />`.
- `/hospital/approvals`, `/hospital/inventory`, and `/hospital/bulk-request` all point to the single `<HospitalDashboard />`.
- `/settings` routes to `<DonorProfile />`.
- Interactive live map is completely absent despite claims in the project documentation.

---

## 6. Recommendations for In-Place Rebuild

1. **Adopt Relational Data Model with ACID Guarantees:** Replace MongoDB document duplication with a clean PostgreSQL schema with foreign keys, check constraints, and transactional isolation.
2. **Eliminate Server Crash Points:** Decouple external service providers (Twilio, Cloudinary, Mailer) behind safe service interfaces that mock gracefully in development and preview environments.
3. **Migrate to PostgreSQL + PostGIS / Spatial Functions:** Enable accurate distance calculation and spatial bounding without external proxy dependencies.
4. **Implement Clean UI/UX Design System:** Replace disjointed Tailwind 4 styling with a unified design system using Tailwind CSS, Radix/shadcn-style accessible primitives, Lucide icons, and Leaflet OpenStreetMap.
5. **Enforce Comprehensive Testing:** Establish automated Vitest unit tests, React Testing Library component tests, and API integration tests.
