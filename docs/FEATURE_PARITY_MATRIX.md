# Feature Parity Matrix: BloodLink Platform Rebuild

**Document Version:** 1.0.0  
**Project:** BloodLink (Blood Donor & Healthcare Matching Platform)  
**Status Key:**  
- 🟢 **Functional:** Working as expected in current repository  
- 🟡 **Partial:** Implemented with UI/logic gaps, placeholder behavior, or bugs  
- 🔴 **Broken:** Crashes on invocation, failing tests, or invalid imports  
- ⚪ **Missing / Phantom:** Documented in README/docs or routed, but no underlying code/component exists  

---

## 1. Authentication & Account Management

| Feature | Existing Files | Current Status | User Roles | Dependencies | Bugs & Limitations | Proposed Replacement | Acceptance Criteria & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Email/Password Registration** | `client/src/modules/auth/pages/RegisterPage.jsx`, `server/modules/auth/auth.controller.js` | 🟡 Partial | Public / All | JWT, bcryptjs, MongoDB | `ToggleBtn` inside render function causes keystroke re-mounts. Phone verification mock only. | React Hook Form + Zod form validation with Supabase Auth / Secure JWT; proper subcomponent encapsulation. | Validates email format, password complexity (min 8 chars, 1 uppercase, 1 symbol), creates user profile with role. |
| **User Login & Session** | `client/src/modules/auth/pages/LoginPage.jsx`, `server/modules/auth/auth.controller.js` | 🟢 Functional | Public / All | JWT (Access + Refresh), HTTP-only cookie | Refresh token flow in RTK Query can get stuck in loops on 401; passwords dual-hashed (`password` vs `passwordHash`). | Secure session management with refresh rotation, unified password column, automatic token handling. | Successfully logs in valid users, rejects invalid credentials, redirects based on role (`/donor/dashboard`, `/hospital/dashboard`, etc.). |
| **OTP Account Verification** | `client/src/modules/auth/pages/OtpVerifyPage.jsx`, `server/modules/auth/auth.service.js` | 🟡 Partial | All | Twilio / Nodemailer, Redis `otpCleanupQueue` | Twilio fatal crash prevents SMS delivery; Redis required for cleanup queue. | Resilient OTP verification with development fallback console logging and production SMS/Email adapters. | Generates 6-digit OTP, expires in 10 minutes, verifies valid OTP, locks after 5 failed attempts. |
| **Password Reset** | `client/src/modules/auth/pages/ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx` | 🟡 Partial | All | Nodemailer | Mailer configuration points to dummy credentials; no fallback error banner. | Cryptographic reset token generated server-side, rate-limited email dispatch, secure password update. | Requests reset link, validates single-use token, resets password, invalidates previous sessions. |
| **Profile Completion** | `client/src/modules/auth/pages/CompleteProfilePage.jsx`, `server/modules/user/` | 🟡 Partial | All | MongoDB User model | Geographic address autocomplete relies on non-functional Mapbox API key. | Reverse-geocoding via OpenStreetMap / Nominatim with graceful fallback and address caching. | Allows selecting blood group, DOB, gender, state/district, and sets `profileCompleted: true`. |

---

## 2. Donor Management & Engagement

| Feature | Existing Files | Current Status | User Roles | Dependencies | Bugs & Limitations | Proposed Replacement | Acceptance Criteria & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Donor Dashboard** | `client/src/modules/donor/pages/DonorDashboard.jsx`, `server/modules/donor/` | 🟡 Partial | Donor | Redux RTK, Framer Motion | Static metrics if no donations; cooldown calculation desynchronized between User and DonorProfile. | Real-time Donor Dashboard displaying availability status, cooldown countdown, total lives impacted, and active urgent requests. | Shows next eligible donation date (56 days post-donation), active requests in donor's district, and badges. |
| **Availability Toggle** | `server/modules/donor/donor.controller.js`, `DonorDashboard.jsx` | 🔴 Broken | Donor | DonorProfile | Only updates `DonorProfile.availability`; matching service queries `User.availability`, causing split-brain. | Single source of truth in PostgreSQL `donor_profiles.availability` with database check constraint and cooldown validation. | Prevents toggling to 'available' if cooldown period has not elapsed; updates status instantly across UI. |
| **Medical Certificate Upload** | `client/src/modules/donor/pages/DonorProfile.jsx`, `server/modules/donor/` | 🟡 Partial | Donor | Cloudinary, Multer | Cloudinary credentials unconfigured; file upload fails silently without cloud keys. | Secure file upload to Supabase Storage / local S3-compatible bucket with MIME-type and 5MB size limits. | Accepts PDF/JPEG/PNG, generates signed URL, marks donor status as `pending_verification`. |
| **Donation History & Streaks** | `client/src/modules/donor/pages/DonorHistoryPage.jsx` | 🟢 Functional | Donor | MongoDB DonorAssignment | Unused imports; static mock fallback if assignments empty. | Verifiable donation ledger with date, units given, recipient hospital, and auto-computed streaks. | Displays chronological donation list, correctly calculates streak count and next eligibility date. |
| **Badges & Trust Score** | `client/src/modules/donor/pages/DonorBadgesPage.jsx` | 🟢 Functional | Donor | DonorProfile.badges | Trust score algorithm is opaque and hardcoded to 50 in seed data. | Transparent Trust Score engine based on verified donations, timely responses, and verified credentials. | Awards badges (First Drop, Regular Hero, Life Saver) upon milestone donation counts. |

---

## 3. Requester Workflows & Emergency Broadcasts

| Feature | Existing Files | Current Status | User Roles | Dependencies | Bugs & Limitations | Proposed Replacement | Acceptance Criteria & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Create Blood Request** | `client/src/modules/requester/pages/CreateRequestPage.jsx`, `server/modules/request/` | 🟡 Partial | Requester, Hospital | Request model, BullMQ | Form contains React 19 memoization warnings; auto-expiry BullMQ queue crashes if Redis offline. | Multi-step accessible request form with blood group compatibility guidance, hospital selector, and urgent flag. | Validates patient details, units (1-10), hospital location; creates request with 15-min to 24-hr expiry window. |
| **Request History & Tracking** | `client/src/modules/requester/pages/RequestHistoryPage.jsx` | 🟡 Partial | Requester | RTK Query | `/requester/dashboard` and `/requester/history` point to identical page; live GPS tracking absent. | Dedicated Requester Dashboard showing active requests, accepted donors, fulfillment progress bar, and status timeline. | Displays real-time status transitions (`pending` -> `accepted` -> `in-progress` -> `completed` -> `expired`). |
| **Live GPS Donor Tracking** | Documented in `README.md` & `/requester/tracking` | ⚪ Missing | Requester | `mapbox-gl` (unused) | Routed to `CreateRequestPage.jsx` instead of a tracking map; Mapbox never instantiated. | Interactive Leaflet/OpenStreetMap view showing approximate donor location with privacy-preserving radius circle. | Renders interactive map, displays donor progress marker within privacy radius, updates coordinates in real time. |
| **Emergency Broadcast System** | `server/modules/request/request.service.js`, `sockets/index.js` | 🟡 Partial | Requester, Admin | Socket.io, BullMQ | Socket broadcast only emits to room `city:district` if client happens to be connected; email notification is a mock console.log. | Multichannel alert system: Real-time database event + In-App notification center + Webhook/Email notification dispatch. | Broadcasts to compatible available donors within specified radius (e.g. 25km); persists notifications in database. |

---

## 4. Hospital & Inventory Management

| Feature | Existing Files | Current Status | User Roles | Dependencies | Bugs & Limitations | Proposed Replacement | Acceptance Criteria & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hospital Dashboard** | `client/src/modules/hospital/pages/HospitalDashboard.jsx` | 🟡 Partial | Hospital | RTK Query | All hospital subroutes (`/hospital/approvals`, `/inventory`, `/bulk-request`) duplicate the same view. | Tabbed / Subrouted Hospital Management Suite with Inventory, Donor Verifications, and Outgoing Requests. | Displays current blood stock, pending donor medical certificates, and pending patient requests. |
| **Blood Stock Inventory** | `HospitalDashboard.jsx`, `server/modules/hospital/` | 🟡 Partial | Hospital | HospitalProfile model | Only 8 blood groups supported; no batch expiration tracking or low-stock warning threshold. | Comprehensive Blood Bank Inventory Tracker with unit counts, minimum threshold alerts, and audit trail. | Allows hospital staff to increment/decrement units per blood group; triggers warning when stock < 5 units. |
| **Donor Verification** | `HospitalDashboard.jsx`, `server/modules/hospital/` | 🟡 Partial | Hospital, Admin | DonorProfile | Verification only sets status string; does not record hospital signature or rejection reasons. | Rigorous Verification Queue with document preview modal, approval/rejection notes, and automated notification to donor. | Allows hospital/admin to review uploaded certificate, approve or reject with comments, and update donor trust score. |
| **Bulk Emergency Requests** | Documented in README | ⚪ Missing | Hospital | Request model | No dedicated bulk request interface exists; routed to generic dashboard. | Bulk Blood Request workflow allowing hospitals to request multiple units across multiple blood groups simultaneously. | Creates linked batch requests, notifies compatible donor groups, tracks fulfillment per blood type. |

---

## 5. Administrative Controls & Reporting

| Feature | Existing Files | Current Status | User Roles | Dependencies | Bugs & Limitations | Proposed Replacement | Acceptance Criteria & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Overview & Analytics** | `client/src/modules/admin/pages/AdminDashboard.jsx`, `server/modules/admin/` | 🟡 Partial | Admin | Recharts, AdminApi | Beautiful UI but chart data breaks if backend analytics returns empty aggregations. | Robust Admin Analytics Portal with Recharts, system health monitors, active user count, and emergency logs. | Renders monthly donation volume, blood group demand distribution, and response time metrics with empty-state handling. |
| **User & Donor Governance** | `UsersPage.jsx`, `DonorsPage.jsx`, `server/modules/admin/` | 🟢 Functional | Admin | MongoDB User model | Basic table listing; lacks granular role switching and bulk actions. | Admin User & Donor Directory with search, filters (role, district, verification, status), suspension toggle, and admin notes. | Enables searching by name/email/phone, filtering by blood group and verification, suspending/activating accounts. |
| **Platform Broadcast Engine** | `client/src/modules/admin/pages/BroadcastPage.jsx` | 🟡 Partial | Admin | Socket.io | Only broadcasts to active sockets; doesn't store notifications in user inboxes. | System-wide Broadcast Manager: broadcasts urgent announcements, saves persistent notifications for all matching users. | Admin can compose title/body, select target audience (all, donors, hospitals, specific district), and broadcast instantly. |
| **Reports (PDF & Excel)** | `server/modules/admin/admin.controller.js` | 🟡 Partial | Admin | `pdfkit`, `exceljs` | Server route exists, but frontend lacks report preview and export progress feedback. | Export Engine supporting Excel (.xlsx) and PDF summary generation for compliance and municipal health reporting. | Generates and downloads downloadable `.xlsx` and `.pdf` reports containing aggregated anonymized donation figures. |
| **Audit Logging** | `client/src/modules/admin/pages/AuditLogsPage.jsx`, `server/modules/admin/auditLog.model.js` | 🟢 Functional | Admin | AuditLog model | Middleware only logs select mutations; lacks IP masking and geographic origin. | Comprehensive Immutable Audit Log capturing authentication, verification changes, and emergency broadcasts. | Chronological audit trail viewable by admins with timestamp, actor, action, and target entity. |

---

## 6. Real-Time & Location Services

| Feature | Existing Files | Current Status | User Roles | Dependencies | Bugs & Limitations | Proposed Replacement | Acceptance Criteria & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Interactive Map** | Missing in UI (`client/src/index.css:237` has unused Mapbox style) | 🔴 Missing | All | Mapbox | Never integrated; README claim is unfulfilled. | Leaflet + OpenStreetMap interactive component with responsive clustering, blood group filters, and custom markers. | Displays regional blood requests and hospitals; renders radius circles without exposing private donor homes. |
| **Geocoding & Reverse Geocoding** | `server/modules/location/location.routes.js` | 🔴 Broken | All | Mapbox API token | Unconditionally returns dummy `district: 'unknown'` when `MAPBOX_ACCESS_TOKEN` is unset. | OpenStreetMap Nominatim / PostGIS spatial functions with client-side cached geocoding. | Automatically resolves latitude/longitude to City, District, and State without paid third-party API dependencies. |
| **Realtime Notifications** | `client/src/pages/NotificationsPage.jsx`, `server/sockets/` | 🟡 Partial | All | Socket.io | Socket connection drops silently without auto-reconnect or unread badge persistence. | Resilient Realtime Notification Hub with Supabase Realtime / WebSocket fallback and notification badge counters. | Updates notification badge immediately upon incoming request; allows marking notifications read/unread. |
