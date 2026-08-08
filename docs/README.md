# QCU MSC Central Portal — Frontend Documentation

Welcome to the official frontend documentation for the **Quezon City University Microsoft Student Community (QCU MSC) Central Portal**.

This web application serves as the primary digital gateway for student membership applications, ID verification, tracking, and applicant communications.

---

## 🏗️ Architecture Overview

The frontend is built using a modern React SPA architecture with SSR-ready capability powered by Vite and TanStack Router.

- **Framework**: React 18, Vite 5, TypeScript 5
- **Routing**: `@tanstack/react-router` (File-based route trees)
- **Styling**: Vanilla CSS + TailwindCSS, Lucide Icons, Space UI Theme System
- **OCR Engine**: Lazy-loaded `tesseract.js` for on-device student ID verification
- **Auth & API Client**: Custom fetch wrappers with `better-fetch` and `getApiEndpoint` path resolution

---

## 📚 Documentation Index

### 🏢 Architecture (`docs/architecture/`)
- [Routing & Page Hierarchy](architecture/routing.md) — File-based route definitions, TanStack Router setup, and navigation guards.
- [API Integration & Endpoint Resolution](architecture/api-integration.md) — Multi-environment API URL resolution, path deduplication, and HTTP fetch wrappers.

### 📖 Workflows & Guides (`docs/guides/`)
- [Applicant Application Flow](guides/application-flow.md) — Complete walkthrough from on-device OCR scan to 3-step batch form submission and account creation.
- [Applicant Tracking & Resubmission](guides/portal-tracking.md) — Status tracking workflow, status badges, resubmission handling, and admin remark notices.
- [Mission Control Inbox System](guides/inbox-system.md) — Dynamic transmission generation, submission greetings, status updates, and localStorage persistence.
- [Assets, OpenGraph & Partner Logos](guides/assets-and-opengraph.md) — OpenGraph link card specs (<300 KB JPEG), dynamic origin resolution, and partner carousel integration.

### 🎨 Specifications & Design (`docs/specs/`)
- [Space UI Design System](specs/design-system.md) — Palette tokens, space gradients, glassmorphism cards, and responsive layout standards.

### 🛠️ Fix Notes (`docs/fix/`)
- [Resilience & Safety Audit (Phases 1-3)](fix/resilience-safety-audit.md) — Shared `apiFetch` client with timeouts, DOB validation fix, hook-order fix, PII log removal, and double-submit locking.
- [Stale Attachment Fix](fix/stale-attachment-fix.md) — Recovering file attachments lost during long application sessions.
- [Resubmission Fix](fix/resubmission-fix.md) — Optional-field handling on the resubmit endpoint.
- [Resume Link Loop Fix](fix/resume-link-loop-fix.md) — Draft resume token handling.
- [Setup Token Missing Fix](fix/setup-token-missing-fix.md) — Account setup link recovery.

---

## 🚀 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start development server
npm run dev
```
- [Applications Closed Patch](guides/applications-closed-patch.md) — gating all `/apply/*` routes while recruitment is closed
