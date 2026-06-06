# ChemPrep LMS — Chemistry Learning Management System

A full-stack, modern LMS dedicated to **Chemistry** preparation for competitive exams:
**JEE, NEET, IAT, NEST, NET, CSIR-NET, GATE, IIT-JAM, TIFR** and more.

## Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS + React Router + Axios + Framer Motion
- **Backend:** Node.js + Express + MongoDB (Mongoose) + JWT Auth + Bcrypt
- **Theme:** White + Blue/Purple gradient (modern, glassy UI)

## Features

### Student (Public / Learner)
- Beautiful landing page with hero slider, trust banners, highlights, results, reviews.
- Browse courses by **exam category** (JEE, NEET, IAT, NEST, NET, CSIR-NET, GATE, IIT-JAM, TIFR).
- Course details, pricing, syllabus.
- Signup / Login → Purchase (mock checkout) → Auto-enroll → Unique Student ID.
- Student dashboard: enrolled courses, lessons, progress.

### Admin Panel
- Secure admin login.
- Add / edit / delete **Courses** with pricing, category, thumbnail, lessons, highlights.
- Manage **Banners, Highlights, Results (Toppers), Reviews, Videos**.
- View all **Students** and their enrollments.
- Dashboard analytics (counts).

## Project Structure

```
LMS Chem/
├── server/          # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
└── client/          # React + Vite + Tailwind
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   └── api/
    └── package.json
```

## Getting Started

### 1. Backend

```bash
cd server
cp .env.example .env       # then edit MONGO_URI + JWT_SECRET
npm install
npm run seed               # optional: seed demo courses, banners, toppers
npm run dev                # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                # starts on http://localhost:5173
```

### Default Admin (after seeding)
- Email: `admin@chemprep.com`
- Password: `Admin@123`

## API Overview

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/register` | Student signup |
| POST | `/api/auth/login` | Login (student/admin) |
| GET  | `/api/courses` | List courses (filter by `?category=JEE`) |
| GET  | `/api/courses/:id` | Course detail |
| POST | `/api/courses` | **Admin** create |
| PUT  | `/api/courses/:id` | **Admin** update |
| DELETE | `/api/courses/:id` | **Admin** delete |
| POST | `/api/enroll/:courseId` | Purchase + enroll |
| GET  | `/api/enroll/me` | My enrollments |
| GET  | `/api/admin/students` | **Admin** all students w/ enrollments |
| GET/POST/DELETE | `/api/content/:type` | Banners, toppers, reviews, videos, highlights |

## License
MIT
