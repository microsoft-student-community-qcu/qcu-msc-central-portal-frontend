# QCU MSC Central Student Portal (Frontend)

The public-facing web application for the **QCU Microsoft Student Community (MSC)** digital hub. This portal allows QCU students to apply for organization membership, submit/verify student credentials via Zonal OCR, track recruitment status, and view/register for upcoming events.

---

## Tech Stack

- **Framework:** React + Vite
- **Routing:** TanStack Router
- **State & Data Fetching:** TanStack Query & Better Auth Client
- **Styling:** Tailwind CSS v4 & Modern UI Components

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Bun or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/microsoft-student-community-qcu/qcu-msc-central-portal-frontend.git
   cd qcu-msc-central-portal-frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` or `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Ensure `VITE_API_URL` points to the running backend API:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

4. Connect to Backend:
   - Clone and set up the backend repository: `qcu-msc-central-portal-backend`.
   - Start MySQL database (e.g., XAMPP) and run Prisma migrations in the backend repo:
     ```bash
     npx prisma migrate dev
     ```
   - Seed the database (if needed):
     ```bash
     npx prisma db seed
     ```
   - Start the backend server (`npm run dev` in the backend folder).

5. Start the development server:
   ```bash
   bun dev
   # or
   npm run dev
   ```

---

## Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL pointing to backend v1 routes | `http://localhost:5000/api/v1` |
