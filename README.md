# SendIT — Modern Parcel Delivery & Logistics Platform (v2.0)

A completely redesigned, full-stack parcel delivery and courier operations platform consisting of four integrated applications:

- **Backend (`Backend/`)** — Express + MongoDB REST API with live tracking checkpoints, dynamic shipping rate engine, customer feedback & ratings, audit logging, live platform settings, and full JSON backup export.
- **Customer Portal (`Frontend/`)** — React + Vite + Tailwind CSS + Redux Toolkit web app with Dark/Light mode, public live tracking, interactive rate calculator, self-registration, shipment booking with saved address book, printable barcoded shipping waybills, billing statements, and CSV exports.
- **Admin Operations Console (`Admin/`)** — React + Vite + Tailwind CSS + Recharts command center with authenticated role-based login, live KPIs & charts, bulk parcel dispatch, live tracking checkpoint logger, fleet/user role management, delivery calendar, audit logs, live pricing configuration, and database backups.
- **Background Worker (`BackgroundServices/`)** — Hardened Node-cron + Nodemailer + EJS notification worker with overlap protection and redesigned responsive HTML email templates.

---

## Quick Start

### 1. Backend API
```bash
cd Backend
cp .env.example .env
npm install
npm run seed   # Optional: populates demo admin, customer, driver, and 6 sample parcels
npm start      # Runs on http://localhost:5000
```

### 2. Customer Frontend
```bash
cd Frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

### 3. Admin Operations Console
```bash
cd Admin
npm install
npm run dev    # Runs on http://localhost:5174
```

### 4. Background Email Worker (Optional)
```bash
cd BackgroundServices
cp .env.example .env
npm install
npm start      # Runs on http://localhost:8001
```

---

## Demo Accounts (after `npm run seed`)

| Role | Email | Password | Portal |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sendit.io` | `Admin@123` | Admin Console (`:5174`) |
| **Customer** | `alex@sendit.io` | `User@123` | Customer Portal (`:5173`) |
| **Driver** | `driver@sendit.io` | `Driver@123` | Customer Portal (`:5173`) |

Sample Tracking IDs seeded: `SND-2026-AX94K2`, `SND-2026-LM72Q8`, `SND-2026-PR39V5`, `SND-2026-KD81M4`, `SND-2026-ZT45W9`, `SND-2026-BN66J1`.
