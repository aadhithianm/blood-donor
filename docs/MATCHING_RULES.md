# BloodLink Matching Rules, Compatibility & Candidate Ranking

**Project:** BloodLink  
**Document Version:** 1.0.0  
**Context:** Healthcare-Adjacent Candidate Discovery Engine  

> [!IMPORTANT]
> **Clinical Disclaimer:** BloodLink provides candidate discovery and communication dispatch only. BloodLink does NOT determine clinical transfusion compatibility, verify cross-matching, or certify medical eligibility to donate. All transfusions and donations require direct cross-match testing and medical screening performed by certified healthcare personnel at a licensed blood bank or hospital.

---

## 1. Red Blood Cell Compatibility Matrix (Discovery Baseline)

Candidate discovery uses standard Red Blood Cell (RBC) ABO and Rh(D) compatibility matrices as an initial search filter:

| Recipient Blood Group | Compatible Donor Blood Groups (Who can donate to this recipient) |
| :---: | :--- |
| **O-** | `O-` |
| **O+** | `O+`, `O-` |
| **A-** | `A-`, `O-` |
| **A+** | `A+`, `A-`, `O+`, `O-` |
| **B-** | `B-`, `O-` |
| **B+** | `B+`, `B-`, `O+`, `O-` |
| **AB-** | `AB-`, `A-`, `B-`, `O-` |
| **AB+** (Universal Recipient) | `AB+`, `AB-`, `A+`, `A-`, `B+`, `B-`, `O+`, `O-` (All groups) |

*Note:* `O-` is treated as the universal red cell donor and is included in all matching searches, but high-urgency notifications prioritize identical matches before expanding to universal groups to conserve O- inventory.

---

## 2. Donor Eligibility & Filter Pipeline

A candidate donor is considered eligible for matching dispatch if and only if **all** of the following criteria are satisfied:

```
[Candidate Query]
       │
       ▼
1. Account Status == Active (is_suspended == FALSE)
       │
       ▼
2. Verification Status == Approved (Medical certificate / ID verified)
       │
       ▼
3. Availability Status == 'available' (Not 'unavailable' and not 'on-cooldown')
       │
       ▼
4. Cooldown Period Elapsed:
   - Male / General: 56 days (8 weeks) since last whole-blood donation
   - Or cooldown_until <= CURRENT_TIMESTAMP
       │
       ▼
5. ABO / Rh Compatibility == TRUE
       │
       ▼
6. Geographic Proximity:
   - Within request radius (Default: 25 km, expandable up to 75 km for critical urgency)
```

---

## 3. Candidate Ranking & Score Algorithm

Eligible candidate donors are scored and ranked for notification and display according to a multi-factor weighting algorithm:

$$\text{MatchScore} = (W_{\text{dist}} \times S_{\text{dist}}) + (W_{\text{exact}} \times S_{\text{exact}}) + (W_{\text{trust}} \times S_{\text{trust}}) + (W_{\text{recency}} \times S_{\text{recency}})$$

Where:
- **Proximity Score ($S_{\text{dist}}$) [Weight: 40%]:**
  $$S_{\text{dist}} = \max\left(0, 1 - \frac{\text{Distance in km}}{\text{Max Search Radius}}\right) \times 100$$
- **Exact Blood Type Match ($S_{\text{exact}}$) [Weight: 30%]:**
  - Identical ABO and Rh: **100 pts**
  - Compatible alternate (e.g., O- for A+ patient): **60 pts**
- **Trust & Reliability Score ($S_{\text{trust}}$) [Weight: 20%]:**
  - Donor Trust Score (0 to 100) based on verified past donations and punctuality.
- **Donation Recency / Readiness ($S_{\text{recency}}$) [Weight: 10%]:**
  - Donors who haven't donated in >90 days receive maximum readiness points.

---

## 4. Concurrency, Deduplication & Atomic Response

1. **Anti-Duplicate Lock:**
   A donor cannot respond more than once to the same request. A database unique constraint on `(request_id, donor_id)` strictly blocks double assignment.
2. **Atomic Units Tracking:**
   When a donor accepts an assignment, the units remaining on the request are decremented inside a database transaction (`FOR UPDATE` row lock). Once `units_fulfilled == units_needed`, the request status shifts to `accepted` / `in-progress` and matching broadcast terminates.
3. **Graceful Timeout & Re-Assignment:**
   If an assigned donor fails to confirm transit within 30 minutes for an urgent request, the system transitions their assignment to `reassigned` and dispatches alerts to the next ranked candidates.

---

## 5. Verification Test Cases

| Test Case ID | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **MATCH-01** | B+ request with O+ and B+ available donors nearby | Both are eligible; B+ donor is ranked higher due to exact blood group score. |
| **MATCH-02** | Donor donated whole blood 30 days ago | Excluded from matching (`on-cooldown` / cooldown until 56 days). |
| **MATCH-03** | Donor verified, available, but 60 km away from a normal (25 km max) request | Excluded from initial broadcast; included if requester expands radius to 75 km. |
| **MATCH-04** | Two donors accept the final remaining unit at the exact same millisecond | Only the first transaction succeeds; the second receives `All units have already been fulfilled`. |
| **MATCH-05** | Unverified donor attempts to mark self as available | Blocked with 403 Forbidden: `Only verified donors can change availability`. |
