# AI-Powered CRM Lead CSV Importer

An intelligent lead extraction and mapping application built for **GrowEasy**. This application allows users to upload any messy, custom, or agency-exported CSV lead spreadsheet. Using Gemini-powered LLM reasoning, the system dynamically identifies, sanitizes, and maps fields into the structured **GrowEasy CRM format**, handling edge cases such as missing values, multiple entries, and custom statuses.

---

## Technical Stack Overview

### 🖥️ Frontend (Next.js App Router)
- **Framework**: Next.js (React 19, TypeScript)
- **Styling**: Vanilla CSS Variables & Themes (Zero Tailwind or external component libraries for full performance and design control)
- **Features**:
  - **Drag & Drop Upload**: Upload any CSV file with interactive drag-over styles.
  - **Dynamic Preview Table**: Displays raw CSV rows before any AI processing occurs. Supports horizontal/vertical scrolling and sticky header/first-column styling.
  - **Real-Time Polling Dashboard**: Monitores active AI extraction status (`PENDING` -> `PROCESSING` -> `COMPLETED`) using a dynamic circular progress gauge.
  - **Import Summary Statistics**: Visually summarizes imported leads, skipped rows, and breakdowns by CRM statuses.
  - **Historical Archive**: Lists previous imports with viewing links and deletion triggers.
  - **Responsive Dual-Themes**: Full support for Light and Dark modes.

### ⚙️ Backend (Node.js & Express)
- **Runtime & Web Framework**: Node.js, Express.js (ES Modules)
- **Database & ORM**: PostgreSQL, Prisma Client
- **AI Processing**: Gemini Pro SDK (`@google/genai`) for batch-processing and mapping.
- **Parsing**: Multer (file upload handling) and `csv-parse` for data extraction.
- **Session Control**: `express-session` for secure cookie-based login states.

---

## Directory Structure

```text
CRM_TOOL/
├── backend/               # Express.js REST API Server
│   ├── prisma/            # DB Schema & migrations
│   ├── src/
│   │   ├── controllers/   # Controllers (Auth, CSV, Import)
│   │   ├── middlewares/   # Session & auth logic
│   │   ├── routers/       # API routes
│   │   └── services/      # Gemini AI mapping service
│   └── .env               # Backend environment keys
│
├── frontend/              # Next.js Web App
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── app/           # App router, globals, layout
│   │   └── components/    # Common UI widgets (Navbar, Table, Upload)
│   └── next.config.ts     # CORS proxy configuration
│
└── README.md              # Root setup documentation
```

---

## Setup & Running Locally

### 1. Prerequisites
- **Node.js**: v18.x or above
- **Docker**: For starting PostgreSQL container (optional if Postgres is installed natively)

---

### 2. Backend Setup
1. Open your terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```ini
   PORT=3000
   DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/postgres"
   GEMINI_API_KEY="your-gemini-api-key"
   ```
4. Push Prisma schema to the database (generates Prisma Client and syncs PostgreSQL tables):
   ```bash
   npx prisma db push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will boot up at `http://localhost:3000`.*

---

### 3. Frontend Setup
1. In a new terminal window, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development build:
   ```bash
   npx next dev -p 3001
   ```
   *We start the frontend on port `3001` to prevent conflicts with the backend. The application proxy configuration in `next.config.ts` automatically maps browser requests from `http://localhost:3001/api/v1/*` to `http://localhost:3000/api/v1/*`.*

---

## Lead Mapping & Import Rules

The AI pipeline maps custom files according to the following GrowEasy rules:
1. **Allowed CRM Statuses**: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`.
2. **Allowed Data Sources**: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`.
3. **Clean Date Formatting**: All extracted `created_at` fields are parsed into ISO strings convertible by `new Date()`.
4. **Lead Notes**: Concatenates remarks, notes, extra phone numbers, and supplementary emails into `crm_note`.
5. **Skipped Records**: Any row lacking **both** an email and a phone number is skipped automatically.
