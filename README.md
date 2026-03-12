# SimplyFin – Personal Budget Web App

> **Bachelor's Thesis Project** · Full-Stack · React + FastAPI + PostgreSQL  
> *Finances made simple — built for students and freelancers who want to save a little more every month.*

SimplyFin is a full‑stack web application designed to help individuals manage their personal finances. The app helps users — especially students and young professionals — track income and expenses, set spending limits, and receive smart reminders for recurring payments.

This project was developed as my Bachelor's thesis in Computer Science and Econometrics at the University of Rzeszów. It combines modern frontend technologies with a robust Python backend and a relational database – all containerised with Docker.
 
The project merges my two areas of study: **software engineering** and **financial literacy**. Rather than building a generic CRUD app, I applied real econometrics and personal finance concepts — spending categorization, period-over-period comparisons, monthly trend analysis — into practical features that reflect how people actually manage money.

---
 
## Features
 
-  **Dashboard** — Monthly income/expense overview with period-over-period comparison (current vs. previous month)
-  **Expense & Income Tracking** — Full transaction history with filtering by category, date range, account member, and account type
-  **Monthly Trend Charts** — 6-month line charts for expenses and income (built with Chart.js)
-  **Recurring Payment Reminders** — Smart suggestion engine that detects when recurring payments are due and prompts the user to confirm or dismiss
-  **Account Types** — Separate tracking for cash, bank account, or any custom wallet
-  **Account Members** — Assign transactions to household members or flatmates
-  **Category Spending Limits** — Set monthly limits per category with visual warnings when exceeded
-  **JWT Authentication** — Secure login and registration with token-based sessions
 
 ---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Tailwind CSS, Chart.js, Lucide Icons |
| **Backend** | Python 3, FastAPI, SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT (JSON Web Tokens), bcrypt password hashing |
| **API Style** | RESTful, with Pydantic schema validation |
| **Testing** |	pytest, FastAPI TestClient (isolated SQLite in‑memory database) |

---

## 📐 Architecture Highlights
 
### Frontend
- Component-driven architecture with reusable UI primitives (`Button`, `Modal`, `TopBar`)
- Global state managed via React Context (`DataRefreshContext`) — avoids prop-drilling across pages while keeping the stack simple (no Redux needed at this scale)
- All API calls centralized in a single `api.js` service layer with automatic 401 handling and session redirect
 
### Backend
- FastAPI with full OpenAPI docs auto-generated at `/docs`
- SQLAlchemy models with proper relationships and cascade deletes
- Recurring payment logic: a suggestion engine calculates the next due date per frequency (`daily`, `weekly`, `monthly`, `yearly`) and avoids duplicate suggestions using period-key deduplication
- Statistics endpoints calculate both absolute totals and month-over-month percentage changes — applying standard financial reporting logic

---

## 🎓 Context & Motivation
 
This project was built as a **Bachelor's thesis** at Uniwersytet Rzeszowski (2026), combining my studies in **Computer Science and Econometrics**.
 
The goal was to solve a real problem I saw among fellow students: most budgeting apps are either too complex, require subscriptions, or aren't designed for people with irregular income (freelancers, students with part-time jobs). SimplyFin is intentionally lightweight, focused on awareness over automation — knowing where your money went is already the first step to saving more.
 
The project also served as a personal deep-dive into full-stack development: designing a relational database schema from scratch, building a REST API with proper auth, and structuring a React app that remains maintainable as it grows.

---
 
## 🚀 Getting Started
 
### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
- (Optional) Node.js and Python if you want to run without Docker
 
### Clone the repository
```bash
git clone https://github.com/eltwor/simplyfin.git
cd simplyfin/backend
```

### Start the application with Docker Compose
```bash
docker-compose up --build
```

### Access the app

Open your browser at http://localhost
The backend API documentation is available at http://localhost:8000/docs

## Future Improvements

- Email notifications for registration and recurring payments.
- Integration with actual bank APIs to import transactions automatically.
- AI‑powered suggestions for savings goals or spending cuts.
- More advanced financial projections and what‑if scenarios.
- Mobile app (React Native) version.

## Author
 
**Eliza Tworkowska**  
Frontend Developer - BSc Computer Science & Econometrics  
📍 Poland  
🔗 [linkedin.com/in/eliza-tworkowska](https://www.linkedin.com/in/eliza-tworkowska)  
🐙 [github.com/eltwor](https://github.com/eltwor)  
✉️ tworkowskaeliza@gmail.com

## License
 
This project is open-source and available under the [MIT License](LICENSE).
