# UI/UX Specification & Screen Hierarchy

**Project:** BloodLink Rebuild  
**Document Version:** 1.0.0  

---

## 1. Information Architecture & Navigation

The platform provides a responsive, role-based navigation model:

```
[Public Visitor]
   ├── Landing Page (Hero, Live Need Map, Compatibility Calculator, Donor Stories)
   ├── Login / Register / OTP / Password Reset
   └── Public Blood Request Feed (Masked donor data, Hospital needs)

[Donor Role]
   ├── Donor Dashboard (Readiness status, Cooldown timer, Emergency requests, Impact stats)
   ├── Urgent Requests Feed (Filter by district, blood group, urgency)
   ├── Donor Profile & Medical Verification (Upload certificate, Manage location)
   ├── Donation History & Badges (Milestone certificates, Streaks)
   └── Notifications & Alerts

[Requester Role]
   ├── Requester Dashboard (Active requests, Response status, Donor transit ETA)
   ├── Create Blood Request Wizard (Patient info, Hospital selector, Blood group, Units, Urgency)
   ├── Request Tracking Map (Live candidate discovery, Radius expansion)
   └── Request History & Fulfillment Receipts

[Hospital Role]
   ├── Hospital Command Dashboard (Emergency triage, Fast request dispatch)
   ├── Blood Bank Inventory Manager (Unit counters, Expiry tracking, Low stock warnings)
   ├── Donor Verification Desk (Review pending medical documents, Approve/Reject)
   └── Bulk Emergency Order (Multi-group crisis orders)

[Administrator Role]
   ├── Platform Overview & Analytics (Demand heatmaps, Response times, Fulfillment rates)
   ├── User & Donor Governance (Role management, Suspensions, Verification oversight)
   ├── Municipal Broadcast Manager (Dispatch urgent SMS/Email/In-App broadcasts to districts)
   ├── Audit Logs & Compliance Trail (Immutable security ledger)
   └── Export Desk (Official Excel & PDF government health reports)
```

---

## 2. Screen Specifications & Key Features

### 2.1 Landing Page (`/`)
- **Hero Section:** Bold headline ("Connecting Lifesavers in Real Time"), live urgency ticker ("14 Urgent Requests in Tamil Nadu right now"), quick call-to-actions ("Find Blood Now" / "Register as Donor").
- **Live Regional Need Map:** Interactive Leaflet preview displaying cluster pins for hospital blood shortages.
- **Blood Compatibility Tool:** Interactive widget allowing visitors to select their blood group and immediately see who they can give to and receive from.
- **Trust & Verification Banner:** Explaining medical review standards, safety protocols, and privacy guarantees.

### 2.2 Donor Dashboard (`/donor/dashboard`)
- **Status Hub:** Prominent availability card displaying:
  - If Eligible: Glowing green card with switch "Available for Emergency Alerts".
  - If Cooldown: Circular progress countdown showing days remaining until eligible to donate again.
- **Nearby Urgencies Feed:** Cards for critical blood requests in the donor's district with distance in km, hospital name, and "I Can Help" button.
- **Impact Stats:** Total donations, lives saved multiplier (1 donation = up to 3 lives), current streak count, and earned trust badges.

### 2.3 Create Request Wizard (`/requester/create-request`)
- **Step 1: Patient & Clinical Need:** Patient name, reason for request (Surgery, Trauma, Emergency, Thalassemia), blood group selector, units needed (1-10).
- **Step 2: Hospital & Geolocation:** Searchable hospital selector, address confirmation, district selector, map pin review.
- **Step 3: Verification & Urgency:** Contact number, optional medical prescription/proof document upload, urgency level (Normal: 24h, Urgent: 6h, Critical: 1h).
- **Review & Broadcast:** Summarizes details and displays expected matching donor count in the district before final dispatch.

### 2.4 Hospital Command Center (`/hospital/dashboard`)
- **Inventory Matrix:** Visual grid of 8 blood groups with color-coded stock levels:
  - Red (< 5 units): Critical shortage
  - Amber (5-15 units): Moderate reserve
  - Green (> 15 units): Ample stock
  - Instant "+ / -" adjustment buttons with audit logging.
- **Pending Approvals Queue:** List of donors who uploaded medical certificates with inline PDF/Image modal viewer and Approve/Reject buttons.

### 2.5 Admin Control Suite (`/admin/dashboard`)
- **Metrics Bar:** Total verified donors, active requests, fulfillment rate (%), average response time (minutes).
- **Demand Charts:** Recharts line chart of requests vs fulfillments over 30 days, donut chart of blood group distribution.
- **User Governance:** Searchable, filterable table with bulk actions and status toggles.
- **System Health:** Status indicators for database connection, storage quota, and realtime signaling.
