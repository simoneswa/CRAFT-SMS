# CRAFT SMS Local Development Setup

This guide provides the necessary steps to initialize the CRAFT SMS Multi-Tenant Platform on a clean development machine.

## Prerequisites
- **Node.js**: v20.x or higher
- **Python**: v3.10.x or higher
- **Package Manager**: `npm` (v10+)
- **OS**: Windows / macOS / Linux

## 1. Backend Initialization
1. Navigate to the `backend/` directory.
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate # or .venv\Scripts\activate on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file with the following keys:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
5. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

## 2. Frontend Initialization
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env.local` file with the following keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ROOT_DOMAIN` (e.g., localhost:3000)
4. Start the development server:
   ```bash
   npm run dev
   ```

## 3. Verification Checklist
- [ ] Backend accessible at `http://localhost:8000/api/health/status`.
- [ ] Frontend accessible at `http://localhost:3000`.
- [ ] Login flow working for seeded institutional accounts.
- [ ] Offline sync initialization successful in browser console.
