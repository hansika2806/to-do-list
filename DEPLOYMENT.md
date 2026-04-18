# Steady Deployment

This repo is split into:

- Frontend: Vercel, built from Vite into `dist/`.
- Backend: Render or Railway, running `node server.js`.
- Database: Supabase table `steady_states`.

## 1. Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `supabase.sql`.
3. Copy:
   - Project URL as `SUPABASE_URL`
   - Service role key as `SUPABASE_SERVICE_ROLE_KEY`

Keep the service role key backend-only. Never put it in Vercel frontend env vars.

## 2. Backend on Render

1. Create a Web Service from this repo.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add environment variables:
   - `ALLOWED_ORIGIN=https://your-vercel-app.vercel.app`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
   - `SUPABASE_TABLE=steady_states`
   - `STEADY_USER_ID=your-private-user-id`
5. Health check path: `/api/health`

## 3. Backend on Railway

1. Create a Railway project from this repo.
2. Railway can use `railway.json`.
3. Add the same backend environment variables listed above.
4. Copy the deployed backend URL.

## 4. Frontend on Vercel

1. Import this repo in Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add frontend environment variable:
   - `VITE_API_URL=https://your-backend-url/api/state`
6. Deploy.

## Local Development

```powershell
npm install
npm run app
```

Without Supabase env vars, the backend stores data in `data/steady-state.json`.

With Supabase env vars, the backend stores data in Supabase.
