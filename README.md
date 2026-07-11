# CRM Tool

A lead-importing CRM application that converts messy CSV lead data into structured CRM-ready records using AI-powered extraction.

This repo contains:
- `backend/`: Express.js REST API, authentication, Prisma PostgreSQL storage, and Gemini AI extraction.
- `frontend/`: Next.js app for CSV upload, import tracking, and result display.

---

## Project Overview

The system enables users to:
- register and login
- upload CSV lead files
- use AI extraction to normalize and map data
- track import status and view summary statistics
- inspect processed leads and skipped rows
- delete old import jobs

---

## Stack

### Backend
- Node.js + Express
- PostgreSQL
- Prisma ORM
- Gemini AI via `@google/genai`
- `csv-parse` for CSV parsing
- `express-session` for auth state
- `cors` for cross-origin requests

### Frontend
- Next.js App Router
- React 19
- TypeScript
- Environment-driven backend URL

---

## Repository Structure

```text
CRM_TOOL/
├── backend/
│   ├── prisma/                # Prisma schema and migrations
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middlewares/       # Auth, validations, and error handling
│   │   ├── routers/           # API route definitions
│   │   ├── services/          # AI, import processor, and business logic
│   │   ├── config/            # env and Gemini client setup
│   │   └── lib/               # Prisma client initialization
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── app/               # Next.js app router entrypoints
│   │   └── components/        # UI components
│   └── .env                   # Frontend environment variables
└── README.md                  # Project documentation
```

---

## Local Setup

### Prerequisites
- Node.js v18 or higher
- PostgreSQL running locally or remotely
- npm installed

### Backend

1. Change to the backend directory:
   ```bash
   cd backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Create or update `backend/.env`:
   ```ini
   PORT=8000
   DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/mydb"
   GEMINI_API_KEY="your_gemini_api_key"
   JWT_SECRET="your_jwt_secret"
   ```
4. Apply Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
   For local development, alternatively:
   ```bash
   npx prisma db push
   ```
5. Run the backend:
   ```bash
   npm run dev
   ```
6. Backend URL:
   ```text
   http://localhost:8000
   ```

### Frontend

1. Change to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Create or update `frontend/.env`:
   ```ini
   NEXT_PUBLIC_API_BASE_URL=https://crm-tool-1-d11p.onrender.com
   ```
4. Run the frontend:
   ```bash
   npm run dev
   ```
5. Frontend URL:
   ```text
   http://localhost:3000
   ```

---

## Environment Variables

### Backend
- `PORT` — API server port
- `DATABASE_URL` — PostgreSQL connection string
- `GEMINI_API_KEY` — Google Gemini API key
- `JWT_SECRET` — secret used for session/auth

### Frontend
- `NEXT_PUBLIC_API_BASE_URL` — base URL for backend API calls

---

## API Endpoints

### Authentication
- `POST /api/v1/user/register`
- `POST /api/v1/user/login`

### Import Process
- `POST /api/v1/import/upload`
- `POST /api/v1/import/:importId/process`
- `GET /api/v1/import/:importId/status`
- `GET /api/v1/import/:importId/leads`
- `GET /api/v1/import/:importId/skipped`
- `GET /api/v1/import/:importId/summary`
- `GET /api/v1/import`
- `DELETE /api/v1/import/:importId`

### Health
- `GET /api/v1/health`

---

## Deployment Notes
- The backend CORS allowlist currently supports:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
  - `https://crm-tool-ten-jet.vercel.app`
- Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL.
- Ensure Prisma client generation is handled before production start.

---

## Architecture Diagram

```mermaid
flowchart LR
  A[Next.js Frontend] --> B[Express API]
  B --> C[Gemini AI]
  C --> D[Parsed CRM Records]
```

---

## Screenshots / Demo

The repository already contains helpful screenshots in the `uploads/` folder. These are only used for documentation and are not required by the application runtime.

![Login Screen](./uploads/Login.png)

![Dashboard](./uploads/Dashboard.png)

![Processing Screen](./uploads/Processing.png)

![Parsing Screen](./uploads/ParsingScreen.png)

![Parsed Output](./uploads/Output.png)

![Parsed Output 2](./uploads/Output2.png)

> Note: The `uploads/` folder is not required for the backend or frontend to work. It is only needed if you want the README to display these image previews.

---

## Recommended Backend Scripts

A production-friendly backend `package.json` should include:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js",
  "postinstall": "npx prisma generate --schema=prisma/schema.prisma"
}
```

---

## Important Notes
- The backend uses Prisma models for `ImportJob`, `ProcessedLead`, `SkippedRecord`, and `AIBatch`.
- Gemini extraction is performed by `@google/genai` and requires a valid API key.
- The frontend depends on `NEXT_PUBLIC_API_BASE_URL` for backend communication.
- If CORS errors persist, verify the deployed frontend origin is included in backend CORS settings.
