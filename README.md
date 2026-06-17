<div align="center">

# 🧠 QCMed

**QCM-based revision platform for Algerian medical students**

[🔗 Live demo](https://qcmed-1x7m.onrender.com)

</div>

## Overview

QCMed is a web platform built for medical students to practice efficiently using MCQs (multiple-choice questions) from past exams of Algerian medical faculties. Questions are organized by **faculty**, **module**, and **course**, enabling focused and progressive revision.

Each student can create an account, configure revision sessions to fit their needs, track their results over time, and review past mistakes through a detailed history.

### ✨ Key Features

- **Authentication**: account creation, login, password recovery, profile management (email, password, account deletion)
- **Faculty / module / course navigation**: structured access to past-year MCQs
- **Customizable sessions**:
  - Scoring mode: *all-or-nothing* or *partial credit*
  - User-defined number of questions
  - Timed mode with a per-question time limit set by the user
  - Answer key displayed at the end of each session
- **Favorites**: save questions to a personal list for targeted revision
- **History**: review all past attempts (questions, given answers, corrections)
- **Progress statistics**: average scores, number of sessions completed, per-module progress tracking
- **Contact page / FAQ** for user support

### 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (hosted on [Neon](https://neon.tech)) |
| Sessions | express-session |
| Authentication | bcrypt |
| Emails | SendGrid |
| Scheduled tasks | node-cron |
| Deployment | Render |

### 📁 Project Structure

```
QCM-med/
├── BACKEND/
│   ├── server-QCM.js        # Server entry point
│   ├── config/               # Configuration (DB connection)
│   ├── controllers/          # Business logic (auth, qcm, favorites, profile, contact)
│   ├── middleware/            # Middlewares (authentication, admin rights)
│   └── routes/                # API route definitions
└── FRONTEND/
    ├── *.html                 # Application pages
    ├── css/                   # Stylesheets
    ├── script/                 # Per-page JS scripts
    ├── images/                 # SVG/JPG illustrations
    └── logo/                   # Brand assets (favicons, logos)
```

### ⚙️ Local Setup

**Requirements**: Node.js and a reachable PostgreSQL database (e.g. Neon instance).

```bash
# Clone the repo
git clone https://github.com/hmt-nada/QCMed.git
cd QCMed/BACKEND

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# then fill in the values (see below)

# Start the server
npm start
```

The Express server starts on `http://localhost:3000` (configurable via `PORT`) and serves both the API (`/api/...`) and the static frontend pages (`FRONTEND/`) — just one server to run, no separate frontend setup needed.

### 🔐 Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL (Neon) connection string |
| `SESSION_SECRET` | Secret key used to sign sessions |
| `SENDGRID_API_KEY` | SendGrid API key (email sending) |
| `BASE_URL` | Base URL of the app (e.g. used in email links) |
| `ADMIN_EMAILS` | List of emails with access to the admin panel |
| `NODE_ENV` | Runtime environment (`development` / `production`) |

> ⚠️ Never commit the `.env` file — it's already listed in `.gitignore`.

### 🚀 Roadmap

- Mobile app
- Collaborative revision mode
- PDF export of answer keys

---

<div align="center">

Built by **hmt-nada**

</div>
