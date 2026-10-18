# Automated Test Plan & Quality Assurance Strategy

**Project:** BloodLink Rebuild  
**Test Frameworks:** Vitest, React Testing Library, Playwright  
**Coverage Target:** >85% for business logic and matching rules  

---

## 1. Test Levels & Strategy

1. **Unit Tests (Vitest):**
   - Blood compatibility calculation logic
   - Candidate ranking algorithm & scoring
   - Cooldown period calculations (56-day rule)
   - Form schema validation rules (Zod)
2. **Component & Integration Tests (React Testing Library):**
   - Authentication forms (Login, Register, OTP, Password Reset)
   - Request creation wizard validation and state transitions
   - Availability toggle behavior under cooldown vs eligible states
   - Hospital inventory counters and low-stock alerts
   - Notification toast and bell counter rendering
3. **Database & Security Tests:**
   - Row Level Security (RLS) enforcement: ensuring unverified users cannot access private phone numbers
   - Atomic locking: ensuring two donors cannot overfulfill a single blood unit
4. **End-to-End (E2E) Journeys (Playwright):**
   - Complete Donor Journey: Register -> Complete Profile -> Upload Medical Certificate -> Toggle Available
   - Complete Requester Journey: Create Urgent Request -> View on Map -> Receive Donor Acceptance -> Complete Request
   - Admin Journey: Login -> View Analytics -> Verify Donor -> Generate Audit Report

---

## 2. Test Execution Commands & Structure

```bash
# Run unit and integration tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate code coverage report
npm run test:coverage

# Run End-to-End browser tests
npm run test:e2e
```

---

## 3. Test Suites & Specific Test Cases

### 3.1 Compatibility Matrix Tests (`src/lib/__tests__/compatibility.test.ts`)
- [x] O- can donate to all 8 blood groups (Universal RBC Donor)
- [x] AB+ can receive from all 8 blood groups (Universal Recipient)
- [x] B- can only receive from B- and O-
- [x] A+ can donate to A+ and AB+ only
- [x] Invalid blood group string triggers validation error

### 3.2 Matching & Ranking Engine Tests (`src/lib/__tests__/matching.test.ts`)
- [x] Filters out donors with `availability_status != 'available'`
- [x] Excludes donors whose `cooldown_until` is in the future
- [x] Ranks exact blood group match higher than compatible alternate match
- [x] Ranks closer donors higher when all other parameters are identical
- [x] Handles empty donor pool gracefully with empty state payload

### 3.3 Concurrency & Lock Tests
- [x] Concurrent invocation of `accept_blood_request()` on a 1-unit request grants assignment to only one donor and rejects the second with a clear error.
