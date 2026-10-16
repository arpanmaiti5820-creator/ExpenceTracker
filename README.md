# Expense Tracker

A full-stack personal finance management application that helps users track income, manage expenses, and monitor their financial activity through a dashboard.

**Live Demo:** [Open Expense Tracker](https://arpanmaiti5820-creator.github.io/ExpenceTracker/)

**GitHub Repository:** [ExpenceTracker](https://github.com/arpanmaiti5820-creator/ExpenceTracker)

## Features

- **User Authentication:** Register and log in using an email and password.
- **Google Sign-In:** Authenticate using a Google account.
- **Dashboard:** View net balance, total income, and total expenses.
- **Transaction Management:** Add, view, edit, and delete transactions.
- **Transaction Categories:** Organize financial records by category.
- **Transaction Search and Filters:** Find transactions and filter records.
- **Trash Management:** Manage deleted transactions.
- **Password Reset:** Request a password-reset link by email and set a new password.
- **Responsive Interface:** Use the application on desktop and mobile devices.
- **Cloud Database:** Store user accounts and transaction records in MongoDB.

## Tech Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB Atlas
- Mongoose

**Authentication and Email**
- JSON Web Tokens (JWT)
- Google Sign-In
- Nodemailer
- Brevo SMTP

**Deployment**
- GitHub Pages — frontend
- Render — backend
- MongoDB Atlas — database

## Project Structure
ExpenceTracker/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── dashboard.css
│   └── dashboard.js
├── .gitignore
└── README.md

*Note: The frontend filenames and folder contents above illustrate the main structure; your repository may contain additional files.*

## Getting Started

### Prerequisites

Install the following before running the project locally:

- Node.js and npm
- MongoDB Atlas account or a MongoDB instance
- Git

### 1. Clone the repository


git clone https://github.com/arpanmaiti5820-creator/ExpenceTracker.git
cd ExpenceTracker


### 2. Install backend dependencies
cd backend
npm install


### 3. Configure environment variables

Create a `.env` file inside the `backend` directory and configure the variables required by the backend:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=http://localhost:5500

GOOGLE_CLIENT_ID=your_google_client_id

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=your_verified_sender_email

Replace the example values with your own credentials. Check the backend source code for any additional required variables.

**Security:** Never commit your `.env` file, passwords, API keys, database credentials, or JWT secrets to GitHub.

### 4. Start the backend

npm run dev

The backend should start on `http://localhost:5000`, provided your environment variables and database connection are configured correctly.

### 5. Run the frontend

Use the VS Code Live Server extension to serve the frontend locally, or configure another local static server. Ensure the frontend API URLs and Google OAuth settings match your local environment.

## Deployment

The project is deployed using separate services:

- **Frontend:** [GitHub Pages](https://arpanmaiti5820-creator.github.io/ExpenceTracker/)
- **Backend:** [Render](https://expencetracker-8lb7.onrender.com)
- **Database:** MongoDB Atlas

The frontend communicates with the backend through API requests. The backend connects to MongoDB Atlas to persist user and transaction data.

## Security Considerations

- Environment variables are used for sensitive configuration.
- Passwords are stored as hashes rather than plain text.
- Authentication uses JWT-based authorization.
- Helmet adds security-related HTTP headers.
- Authentication routes use rate limiting.
- CORS restricts browser requests to approved frontend origins.
- Password-reset links use expiring, single-use tokens.

## Learning Outcomes

This project demonstrates practical experience with:

- Full-stack web application development
- REST API design and integration
- User authentication and authorization
- MongoDB data modeling and persistence
- Email integration and password recovery
- Frontend-to-backend communication
- Cloud deployment and environment configuration
- Basic web application security

## Future Improvements

- Add monthly spending reports and budget alerts.
- Introduce data visualization and downloadable financial reports.
- Add automated testing and CI/CD checks.
- Improve accessibility and application performance.

## Author

**Arpan Maiti**

B.Tech Computer Science and Engineering Student

- GitHub: [arpanmaiti5820-creator](https://github.com/arpanmaiti5820-creator)

---

If you find this project useful, feel free to explore the repository and try the live demo.
