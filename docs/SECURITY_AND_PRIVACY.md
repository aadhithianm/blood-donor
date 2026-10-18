# Security, Privacy & Healthcare Compliance Specification

**Project:** BloodLink Rebuild  
**Classification:** Sensitive Healthcare & Geolocation Data  

---

## 1. Threat Model & Privacy Principles

1. **Principle of Least Privilege:** Users only have access to data necessary for their specific role and active workflows.
2. **Donor Geolocation Privacy:** Exact donor coordinates (`latitude`, `longitude`) are NEVER broadcast to general users or public maps. Only fuzzy regional indicators (District / Town name or randomized +/- 1.5 km centroid jitter) are exposed until an emergency donation match is accepted.
3. **Contact Protection:** Donor phone numbers and personal emails are hidden behind in-app signaling until both requester and donor confirm assignment.
4. **Zero Client Secret Leakage:** Service-role keys, database passwords, and privileged webhook secrets are strictly confined to backend edge functions or environment variables and NEVER exposed to Vite frontend bundles (`VITE_` prefix forbidden for private keys).

---

## 2. Row Level Security (RLS) Policies

All tables have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

### 2.1 `profiles` Table Policies
- **Read (Self):** A user can always view their own profile.
- **Read (Public):** Other users can view public profile details (`full_name`, `avatar_url`, `role`, `blood_group`, `district`) but NOT `phone` or exact `location`.
- **Write (Self):** A user can update their own name, avatar, and contact number. Role and verification status can ONLY be updated by `admin`.

```sql
-- Read Own
CREATE POLICY "Users can view own full profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Read Public Directory (Masked)
CREATE POLICY "Public can view non-sensitive profile info" ON profiles
    FOR SELECT USING (is_suspended = FALSE);

-- Update Own Profile
CREATE POLICY "Users can update own profile except role and verification" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admin Full Access
CREATE POLICY "Admins have full access to profiles" ON profiles
    FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

### 2.2 `blood_requests` Table Policies
- **Read:** Any authenticated user can view active requests.
- **Create:** Only authenticated `requester`, `hospital`, or `admin` accounts can create requests.
- **Update:** Only the creator or an `admin` can modify request parameters or cancel it.

---

## 3. Contact & Location Obfuscation Logic

When querying nearby donors for display on discovery lists or emergency cards:
- **Server/DB Layer:** Calculates exact distance using PostGIS:
  ```sql
  ST_Distance(location, ST_SetSRID(ST_MakePoint(req_lng, req_lat), 4326)::geography) / 1000 AS distance_km
  ```
- **API Output:** Returns `distance_km` rounded to 1 decimal place (e.g. "3.2 km away") and `district`, while stripping `latitude` and `longitude` from the payload sent to the requester's browser.
- **Phone Number Masking:** Shown as `+91 98****3210` until the donor explicitly accepts the request.

---

## 4. Audit Logging & Security Operations

All sensitive administrative and verification actions trigger an immutable audit log entry in `audit_logs`:
- Donor verification approvals or rejections
- Account suspensions or role elevations
- Emergency broadcasts to municipal districts
- Mass exports of donation data
