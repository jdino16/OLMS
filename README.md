# Admin Dashboard - Full Stack Project

A full-stack web application with React frontend, Python Flask backend, and MySQL database.

## Project Structure

```
├── frontend/          # React application
├── backend/           # Python Flask API
├── database/          # MySQL database scripts
└── README.md
```

## Features

- Admin login system
- Admin dashboard with sidebar navigation
- MySQL database integration
- RESTful API endpoints
- Modern React UI with responsive design

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MySQL (v8.0 or higher)
- pip (Python package manager)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up MySQL database (choose one option):

   **Option A: Automated Setup (Recommended)**
   ```bash
   python setup_database_simple.py
   ```

   **Option B: Using Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   python setup_database.py
   ```

   **Option C: Manual Setup**
   - See `MANUAL_DATABASE_SETUP.md` for detailed instructions
   - Use MySQL command line, Workbench, or phpMyAdmin

6. Update database configuration in `backend/config.py` (if needed)

7. Run the Flask application:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

## Default Admin Credentials

- Username: admin
- Password: admin123

## API Endpoints

- `POST /api/login` - Admin login
- `GET /api/dashboard` - Get dashboard data
- `GET /api/admin/profile` - Get admin profile

## Technologies Used

- **Frontend**: React, React Router, Axios, CSS3
- **Backend**: Python Flask, Flask-CORS, PyMySQL
- **Database**: MySQL
- **Authentication**: Session-based
