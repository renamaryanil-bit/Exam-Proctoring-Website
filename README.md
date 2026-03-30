# ProctorOS — Online Exam Proctoring Platform

A full-stack online examination platform with real-time proctoring, JWT authentication, and MongoDB persistence.

## Stack

| Layer    | Tech                               |
|----------|------------------------------------|
| Frontend | React 19, Vanilla CSS, custom design system |
| Backend  | Node.js, Express, MongoDB (Mongoose) |
| Auth     | JWT (via ExamGuard backend)         |

## Features

- 🛡️ **Role-based access** — Admin, Teacher, Student dashboards
- 🔐 **Real authentication** — JWT tokens, per-role login
- 📚 **Class management** — Create classes, enroll/remove students
- 📝 **Exam builder** — Single choice, multiple choice, subjective questions
- ⏱️ **Live exam taking** — Timer, question navigator, mark-for-review
- 🎥 **Live proctoring** — Tab-switch detection, violation logging
- 📊 **Analytics** — Score distribution, per-student results
- 🎓 **Student portal** — Available exams, past results

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally at `mongodb://127.0.0.1:27017`
- The [ExamGuard backend](https://github.com/renamaryanil-bit) running on port 5000

### Frontend setup

```bash
cd online-proctoring

# Install dependencies
npm install

# Copy the env template
cp .env.example .env

# Start the dev server (proxies /api → localhost:5000)
npm start
```

The app will open at **http://localhost:3000**

### Backend setup (ExamGuard)

```bash
cd examguard-project
npm install

# Create .env with:
# MONGO_URI=mongodb://127.0.0.1:27017/examguard
# JWT_SECRET=your_secret_here

# Seed the admin user
node seed.js

# Start the API server
npm run dev   # or: node server.js
```

## Default Credentials (after seeding)

| Role  | Username | Password |
|-------|----------|----------|
| Admin | `admin`  | `admin123` |

The admin creates teachers and students from the dashboard.

## Project Structure

```
src/
├── components/
│   ├── screens/          # All main screens
│   │   ├── AdminDash.jsx
│   │   ├── TeacherDash.jsx
│   │   ├── StudentDash.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── ExamScreen.jsx
│   │   ├── ExamConfigScreen.jsx
│   │   ├── CoursesScreen.jsx
│   │   ├── AnalyticsScreen.jsx
│   │   ├── ProctorScreen.jsx
│   │   ├── ProfileScreen.jsx
│   │   └── PreCheck.jsx
│   └── ui/               # Reusable UI components
├── context/
│   └── AuthContext.js    # Global auth state (JWT + user)
├── services/
│   └── api.js            # Centralised API layer
└── data/
    └── tokens.js         # Design tokens (colours, fonts)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/users` | List all users (admin) |
| POST | `/api/users` | Create user (admin) |
| DELETE | `/api/users/:id` | Delete user (admin) |
| GET | `/api/classes` | Get classes (role-filtered) |
| POST | `/api/classes` | Create class (admin) |
| PUT | `/api/classes/:id/students` | Add/remove students |
| GET | `/api/tests/available` | Available exams (student) |
| GET | `/api/tests/my-tests` | Teacher's exams |
| POST | `/api/tests` | Create exam (teacher) |
| POST | `/api/submissions` | Submit exam (student) |
| POST | `/api/violations` | Log proctoring event |
| GET | `/api/violations/students/:testId` | Violation summary for proctor |
