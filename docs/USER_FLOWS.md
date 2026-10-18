# Critical User Flows & Interaction Journeys

**Project:** BloodLink Rebuild  
**Document Version:** 1.0.0  

---

## Flow 1: Donor Registration, Verification & Availability

```mermaid
sequenceDiagram
    autonumber
    actor Donor as New Donor
    participant Web as BloodLink Web App
    participant Auth as Auth Engine
    participant DB as PostgreSQL (Supabase)
    actor Hospital as Hospital / Admin

    Donor->>Web: Submits Registration (Name, Email, Blood Group, District, Phone)
    Web->>Auth: Creates Account & Profile
    Auth->>DB: Stores Profile with verification_status = 'pending'
    Web-->>Donor: Prompts to upload Medical Certificate / ID
    Donor->>Web: Uploads Medical Certificate (PDF/Image)
    Web->>DB: Stores Document & sets status = 'pending_review'
    
    Hospital->>Web: Views Verification Queue
    Hospital->>Web: Reviews document & clicks "Approve"
    Web->>DB: Updates donor_profiles.verification_status = 'approved'
    DB-->>Donor: Dispatches In-App Notification: "Account Verified!"
    
    Donor->>Web: Toggles Availability Switch to ON
    Web->>DB: Validates cooldown_until <= NOW(); sets availability = 'available'
    Web-->>Donor: Confirms "You are now active for emergency broadcasts"
```

---

## Flow 2: Emergency Blood Request Creation, Matching & Donor Response

```mermaid
sequenceDiagram
    autonumber
    actor Requester as Requester / Hospital
    participant Web as Web Client
    participant DB as PostgreSQL / PostGIS
    participant Realtime as Realtime Event Engine
    actor Donor as Eligible Donor

    Requester->>Web: Fills Emergency Request (Blood: B+, Units: 2, Urgency: Critical, Hospital: City General)
    Web->>DB: Inserts into blood_requests
    DB->>DB: Executes PostGIS query: Find compatible donors within 25 km
    DB->>Realtime: Broadcasts 'new_emergency_request' to matched donors
    Realtime-->>Donor: Instant notification popup with sound/toast & vibration
    
    Donor->>Web: Clicks Notification, reviews distance (4.2 km) & hospital details
    Donor->>Web: Clicks "I Can Help / Accept Request"
    Web->>DB: Calls atomic SQL function accept_blood_request()
    Note over DB: Locks request row FOR UPDATE to prevent double fulfillment
    DB->>DB: Creates donor_assignment, increments units_fulfilled
    DB-->>Requester: Real-time update: "Donor accepted! ETA: 30 mins"
    Web-->>Donor: Displays Hospital Location on Leaflet Map with Turn-by-Turn Directions
```

---

## Flow 3: Donation Verification, Cooldown & Milestone Badge Award

```mermaid
sequenceDiagram
    autonumber
    actor Donor as Donor
    actor Hospital as Hospital Staff
    participant Web as Web App
    participant DB as PostgreSQL

    Donor->>Hospital: Arrives at Hospital, completes blood draw
    Hospital->>Web: Opens Request Management Desk
    Hospital->>Web: Selects Donor and clicks "Confirm Donation Received"
    Web->>DB: Updates donor_assignment.status = 'completed'
    DB->>DB: Increments total_donations by 1
    DB->>DB: Sets cooldown_until = NOW() + 56 DAYS
    DB->>DB: Sets availability_status = 'on-cooldown'
    DB->>DB: Checks milestone badges (e.g. 5th donation -> 'Regular Hero')
    DB-->>Donor: Push Notification: "Thank you for saving a life! Badge earned: Regular Hero 🏆"
    Web-->>Donor: Dashboard displays 56-day cooldown ring with next eligible date
```
