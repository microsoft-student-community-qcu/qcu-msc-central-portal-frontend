# Applicant Onboarding Workflow Guide

This guide documents the full end-to-end applicant onboarding flow implemented in `/apply` and `/apply/account`.

---

## 🔄 Workflow Steps Overview

```
[1. ID Photo Scan] ➔ [2. Identity Confirmation] ➔ [3. Compressed 3-Step Form] ➔ [4. Account Setup]
```

---

## 🔒 Stage 0: On-Device OCR ID Verification

1. **Scanner Component (`IdUploadScanner`)**:
   - Lazy-loaded `tesseract.js` chunk to keep initial bundle size small.
   - Captures photo from camera or user file upload.
2. **Backend Processing (`POST /ocr/verify`)**:
   - If OCR succeeds: Returns `studentId`, `firstName`, `lastName`, `middleInitial`, `ocrSessionId`, `manualRequired: false`.
   - If Attempt 1 or 2 fails (`attemptsRemaining > 0`): Returns error message and keeps user on **Scan Stage** to retake/reupload a clearer photo.
   - If Attempt 3 fails (`attemptsRemaining === 0`): Returns `ocrSessionId` with **`manualRequired: true`**, advancing user to manual entry.

---

## ✏️ Stage 1: Identity & Name Confirmation (`ConfirmIdStep`)

- Applicant verifies extracted Student ID (`YY-NNNN`), Full Name, and Personal Email.
- If `manualRequired: true`, all fields unlock so the applicant can type their details manually by hand.

---

## 📋 Stage 2: Compressed 3-Step Batch Form

### Step 1: Personal & Contact Profile
- **Personal**: Date of Birth, Place of Birth, Gender
- **Contact**: Cellphone Number (11 digits), House Address, Facebook Profile Link

### Step 2: Academics
- **Academic & Office**: College, Program *(Filtered dynamically)*, Section, Campus, Preferred Office
- **Required Documents**: Certificate of Registration (COR) & Curriculum Vitae (CV) file uploaders.

### Step 3: Experience & Showcase
- **Background**: Interests/Skills/Hobbies & Past Organizations/Clubs textareas.
- **Showcase**: Portfolio Website URL, GitHub / Project Links, Previous Works & Achievements.

---

## 👤 Stage 3: Cockpit Account Setup (`/apply/account`)

- Upon successful submission to `POST /applicants`, applicant data (including `applicantId`) is saved to `sessionStorage`.
- User creates password for their registered personal email.
- Account creation links user login account via `POST /users/link-applicant`.
- Applicant is automatically logged in and redirected to `/portal/tracking`.
