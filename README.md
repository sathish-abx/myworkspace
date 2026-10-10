# MyWorkspace: Simple Full-Stack Firebase CRUD Application

MyWorkspace is a portfolio web application built with **React**, **TypeScript**, **Vite**, **Node.js**, **Express.js**, **Firebase Authentication**, and **Cloud Firestore**.

It demonstrates end-to-end full-stack development, including mandatory email verification, token-based Express backend authorization (using Firebase Admin SDK), user profile management, and complete task CRUD operations.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router DOM, Lucide Icons, Vanilla CSS (Glassmorphism design)
- **Backend**: Node.js, Express.js
- **Authentication**: Firebase Authentication (Email/Password + Built-in Email Verification)
- **Database**: Cloud Firestore
- **Frontend Hosting**: Firebase Hosting (Spark Plan)
- **Backend Hosting**: Render Free Web Service

---

## 📁 Directory Structure

```text
myworkspace/
├── src/
│   ├── components/
│   │   ├── Layout.tsx             # Sidebar navigation, topbar, mobile drawer
│   │   └── ProtectedRoute.tsx     # Enforces authenticated & email_verified access
│   ├── context/
│   │   └── AuthContext.tsx        # React context for auth state and reload triggers
│   ├── lib/
│   │   ├── firebase.ts            # Client Firebase JavaScript SDK configuration
│   │   └── api.ts                 # Reusable API fetch helper with Bearer ID Token header
│   ├── pages/
│   │   ├── Login.tsx              # Sign in & Password reset trigger
│   │   ├── Signup.tsx             # Registration & Email verification trigger
│   │   ├── VerifyEmail.tsx        # Pending verification screen & re-check status
│   │   ├── Dashboard.tsx         # Overview cards & top 5 recent tasks
│   │   ├── Tasks.tsx             # Complete Task CRUD (Create, Read, Update, Delete)
│   │   ├── Profile.tsx           # Profile view and editing
│   │   └── Settings.tsx          # Account settings & safe deletion
│   ├── App.tsx                    # Route definitions
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Design system tokens and styling
├── backend/
│   ├── index.js                   # Express REST API & Firebase Admin SDK initialization
│   └── package.json               # Backend self-contained dependencies
├── .env                           # Local environment variables
├── .env.example                   # Environment variable template
├── firestore.rules                # Security rules denying direct client database access
├── firebase.json                  # Firebase Hosting rewrite config for SPA
└── README.md
```

---

## 🔒 Security Architecture

1. **Firestore Security Rules**: Direct client reads and writes are denied (`allow read, write: if false;`).
2. **Backend Enforcement**: All profile and task operations are handled by the Express backend using **Firebase Admin SDK**.
3. **Email Verification**: Every protected Express endpoint verifies the Firebase ID token and explicitly checks the `email_verified` claim. Unverified accounts receive HTTP 403 Forbidden.

---

## 🛠️ Environment Variables

Copy `.env.example` to `.env` in the root directory:

```env
# Frontend Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Frontend API URL (Local backend default)
VITE_API_BASE_URL=http://localhost:5000/api

# Backend Server (Optional)
PORT=5000
# Optional: Service Account JSON string for Render backend deployment
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## 💻 Local Development Setup

### 1. Install Dependencies

In the root directory:
```bash
npm install
```

In the `backend` directory:
```bash
cd backend
npm install
cd ..
```

### 2. Run the Express Backend

```bash
cmd.exe /c npm run dev:backend
# OR from root:
node backend/index.js
```
The backend server runs at `http://localhost:5000/api`.

### 3. Run the Frontend Development Server

```bash
cmd.exe /c npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Express REST API Endpoints

All protected endpoints require the header `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Service health status | No |
| `GET` | `/api/profile/me` | Fetch or auto-initialize profile | Yes (Verified) |
| `POST` | `/api/profile` | Create user profile | Yes (Verified) |
| `PATCH` | `/api/profile/me` | Update user profile fields | Yes (Verified) |
| `GET` | `/api/dashboard/stats` | Summary statistics & 5 recent tasks | Yes (Verified) |
| `GET` | `/api/tasks` | Get all tasks for user | Yes (Verified) |
| `GET` | `/api/tasks/:id` | Get single task | Yes (Verified) |
| `POST` | `/api/tasks` | Create a new task | Yes (Verified) |
| `PATCH` | `/api/tasks/:id` | Update task fields | Yes (Verified) |
| `DELETE` | `/api/tasks/:id` | Delete task document | Yes (Verified) |
| `DELETE` | `/api/account` | Safe user account & data deletion | Yes (Verified) |

---

## ☁️ Deployment Instructions

### Deploy Backend to Render (Free Web Service)

1. Create a GitHub repository and push your project code.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Set:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
6. Add Environment Variables in Render Dashboard:
   - `PORT`: `5000`
   - `VITE_FIREBASE_PROJECT_ID`: `myworkspace-6e5b0`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: paste the JSON string of your Firebase Service Account Private Key.
7. Click **Create Web Service** and copy your Render service URL (e.g., `https://myworkspace-backend.onrender.com`).
8. Update `VITE_API_BASE_URL` in your frontend configuration with `https://myworkspace-backend.onrender.com/api`.

### Deploy Frontend to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Log in to Firebase: `firebase login`
3. Build the production React frontend: `npm run build`
4. Deploy to Firebase Hosting: `firebase deploy --only hosting`

---

## ⚡ Free Hosting Notice

Render Free web services automatically spin down after 15 minutes of inactivity. When a request comes in after a cold sleep, the first request may take 30–50 seconds to respond while the server wakes up. Subsequent requests respond instantly.
