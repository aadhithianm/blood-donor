# Production Deployment & Operations Guide

**Project:** BloodLink  
**Target Environments:** Staging / Production  
**Hosting Model:** Vercel (Frontend & Edge CDN) + Supabase (PostgreSQL, Auth, Storage, Realtime)  

---

## 1. Prerequisites & Environment Variables

Create a project in [Supabase](https://supabase.com) and link your GitHub repository to [Vercel](https://vercel.com).

### Required Environment Variables (`client/.env`)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key

# Application Settings
VITE_APP_NAME="BloodLink"
VITE_APP_URL=https://bloodlink.vercel.app
VITE_DEFAULT_LOCALE="en"
```

> [!CAUTION]
> NEVER expose `SUPABASE_SERVICE_ROLE_KEY` in frontend environment files. That key bypasses all Row Level Security and must only be stored in secure backend serverless functions.

---

## 2. Database Provisioning & Migrations

1. Open your Supabase Dashboard SQL Editor.
2. Run the migration scripts located in `supabase/migrations/`:
   - `01_init_schema.sql` (Tables, ENUMs, Indexes, Constraints)
   - `02_rls_policies.sql` (Row Level Security rules)
   - `03_functions_triggers.sql` (Atomic request fulfillment, Cooldown auto-calculation)
   - `04_seed_data.sql` (Seed hospitals, realistic donor profiles, and test accounts)
3. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

---

## 3. Continuous Integration & Deployment (CI/CD)

The repository uses GitHub Actions (`.github/workflows/ci.yml`) to validate every commit and pull request:
1. **Linting Check:** `npm run lint` ensures code cleanliness and hook safety.
2. **Type Check:** `npm run typecheck` ensures TypeScript type safety.
3. **Automated Tests:** `npm run test` executes Vitest unit and integration suites.
4. **Production Build:** `npm run build` verifies bundling and asset optimization.
5. **Vercel Edge Deployment:** Automatically deploys passing builds to preview/production URLs.
