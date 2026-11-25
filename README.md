# TalentPath AI

**Your skills crossed borders. Your recognition should too.**

TalentPath AI is a full-stack web application built for the **"Unlocking Displaced Talent: Pathways for Skilled Refugees"** hackathon theme. It helps skilled refugees and displaced professionals in Kenya organize prior experience, store supporting documents privately, run AI-assisted skills and evidence-gap assessments, navigate Recognition of Prior Learning (RPL) pathways, review legal and financial readiness checklists, match with opportunities, and export employer-ready PDF portfolios.

---

## Key Features

- **Role-Based Access Control (Backend Enforced)**:
  - **Professional / Candidate**: Profile management, private Document & Evidence Centre, AI Skills Assessment, Recognition Pathway Navigator, Legal & Financial Readiness, Opportunities & Saved items, Portfolio & PDF export, and Privacy/Consent controls.
  - **Employer / Mentor**: Consent-gated talent portal displaying only candidates who explicitly enable sharing permissions.
  - **Administrator**: Platform-level aggregate metrics and demonstration opportunity listing management.
- **Private Evidence Vault**: Validated uploads (`PDF`, `PNG`, `JPG`, `TXT`, `DOCX` up to 10 MB) stored outside public web roots with owner-only streaming checks.
- **Server-Side Gemini AI (`gemini-4-hydrogen`) + Demo Mode**: Executes structured JSON analysis for profile summaries, document extraction, skills assessments, Kenyan recognition checklists, opportunity matching, and portfolio generation. When `GEMINI_API_KEY` is not set, all AI workflows switch cleanly to a transparently labeled **Demo Mode**.
- **Kenyan Recognition Directory**: Links to official portals including KNQA, KNQA RPL Portal, TVETA, NITA, UNESCO Qualifications Passport, Department of Refugee Services (DRS), Engineers Board of Kenya (EBK), and KNEC.
- **PDF Portfolio Export**: Generates structured A4 PDF reports directly in the browser using `jspdf`.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion (`motion/react`), Recharts, jsPDF
- **Backend**: Node.js, Express, `better-sqlite3` (SQLite relational database), `multer`, `crypto.scrypt` password hashing
- **AI**: Google `@google/genai` SDK (`gemini-4-hydrogen`) via server-side `/api/*` routes

---

## Local Setup & Environment Variables

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (see `.env.example` — never commit real secrets):
   - `GEMINI_API_KEY` *(optional)* — Your Google Gemini API key. If omitted, TalentPath AI operates in clearly labeled Demo Mode.
   - `APP_URL` *(optional)* — Base URL of the deployed application.
   - `PORT` *(optional)* — Server port (defaults to `3000`).

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build and run for production:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

---

## Demonstration Journey (SAMPLE DATA)

On first run, TalentPath AI seeds three clearly labeled `SAMPLE DATA` / `DEMO DATA` accounts (accessible via 1-click Demo Login on the Sign-In page):
- **Candidate**: `amina.demo@talentpath.example` (Fictional displaced civil & solar engineer in Nairobi)
- **Employer / Mentor**: `mentor.demo@talentpath.example`
- **Administrator**: `admin.demo@talentpath.example`

No real refugee personal information is used in demonstration data.

---

## Responsible AI & Official Verification Notice

TalentPath AI provides AI-assisted career preparation and informational checklists only. It does **not** verify academic credentials, issue professional licences, or provide legal advice. Official recognition rests solely with statutory Kenyan institutions.

---

**Designed & Developed by Abdiwali Abdi**  
GitHub: [thesonofbillionairemom-netizen](https://github.com/thesonofbillionairemom-netizen) | Email: thesonofbilionairemom@gmail.com
