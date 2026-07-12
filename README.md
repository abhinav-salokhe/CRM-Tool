# CRM Tool

An AI-powered CSV Importer that intelligently converts CSV files with varying structures into structured CRM-ready lead records using Gemini AI.

This repository contains:
- **backend/** – Express.js REST API, authentication, Prisma ORM, PostgreSQL, and Gemini AI integration.
- **frontend/** – Next.js application for uploading CSVs, previewing data, processing imports, and viewing results.

---

# Live Demo

**Application:** https://crm-tool-ten-jet.vercel.app/

**Backend API:** https://crm-tool-1-d11p.onrender.com

---

# Demo Credentials

You may either register a new account or use the following demo account:

| Username | Password |
|----------|----------|
| admin | admin123 |

---

# Features

- User Registration & Login
- Upload CSV files of any structure
- CSV Preview before AI processing
- AI-powered CRM field extraction
- Intelligent field mapping using Gemini AI
- Batch processing
- Invalid record detection & skipping
- Import history
- Import statistics
- Responsive UI
- Clean error handling

---

# Tech Stack

## Frontend

- Next.js (App Router)
- React 19
- TypeScript

## Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Gemini AI (`@google/genai`)
- csv-parse
- express-session
- cors

---

# Repository Structure

```text
CRM_TOOL/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middlewares/
│   │   ├── routers/
│   │   ├── services/
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   └── components/
│   └── package.json
│
└── README.md
```

---

# Project Workflow

1. Register/Login
2. Upload CSV
3. Preview uploaded data
4. Confirm Import
5. AI processes records in batches
6. CRM records are generated
7. Invalid records are skipped
8. Results & statistics are displayed

---

# Local Setup

## Prerequisites

- Node.js 18+
- PostgreSQL
- npm

---

## Backend

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=8000

DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb

GEMINI_API_KEY=your_api_key

JWT_SECRET=your_secret
```

Run migrations

```bash
npx prisma migrate deploy
```

or

```bash
npx prisma db push
```

Run backend

```bash
npm run dev
```

Backend

```
http://localhost:8000
```

---

## Frontend

```bash
cd frontend
npm install
```

Create `.env`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Run

```bash
npm run dev
```

Frontend

```
http://localhost:3000
```

---

# Environment Variables

## Backend

| Variable | Description |
|-----------|-------------|
| PORT | API Port |
| DATABASE_URL | PostgreSQL URL |
| GEMINI_API_KEY | Gemini API Key |
| JWT_SECRET | Authentication Secret |

## Frontend

| Variable | Description |
|-----------|-------------|
| NEXT_PUBLIC_API_BASE_URL | Backend URL |

---

# API Endpoints

## Authentication

```
POST /api/v1/user/register
POST /api/v1/user/login
```

## Import

```
POST /api/v1/import/upload
POST /api/v1/import/:importId/process

GET /api/v1/import
GET /api/v1/import/:importId/status
GET /api/v1/import/:importId/leads
GET /api/v1/import/:importId/skipped
GET /api/v1/import/:importId/summary

DELETE /api/v1/import/:importId
```

## Health

```
GET /api/v1/health
```

---

# Architecture

```mermaid
flowchart LR

A[Next.js Frontend]
--> B[Express Backend]

B --> C[CSV Parser]

C --> D[Gemini AI]

D --> E[Structured CRM Records]

E --> F[Database]

F --> G[Frontend Dashboard]
```

---

# Deployment

## Frontend

Vercel

https://crm-tool-ten-jet.vercel.app/

## Backend

Render

https://crm-tool-1-d11p.onrender.com

---

# Screenshots

## Login

![Login](./uploads/Login.png)

---

## Dashboard

![Dashboard](./uploads/Dashboard.png)

---

## CSV Processing

![Processing](./uploads/Processing.png)

---

## Parsing Screen

![Parsing](./uploads/ParsingScreen.png)

---

## Parsed Output

![Output](./uploads/Output.png)

---

## Parsed Output (More Results)

![Output2](./uploads/Output2.png)

---

# Production Scripts

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js",
  "postinstall": "prisma generate"
}
```

---

# Notes

- AI extraction is powered by Gemini AI.
- Records are processed in batches.
- Invalid records (without email and mobile) are skipped.
- Supports CSV files with varying column names and layouts.
- CORS is configured for local development and deployed frontend.
- Prisma generates CRM records stored in PostgreSQL.

---

# Author

**Abhinav Salokhe**

GitHub: https://github.com/abhinav-salokhe

Email: abhinavsalokhe2003@gmail.com
