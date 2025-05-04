# QuantumChain AI AI AI - P2P Cryptocurrency Exchange

A modern P2P cryptocurrency exchange platform with AI-powered features.

## Features

- User Authentication (Register/Login)
- KYC Verification System
- Modern Dashboard with Market Overview
- Secure File Upload for KYC Documents
- Responsive Design with Dark Theme

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: MySQL
- Styling: Styled Components
- Authentication: JWT
- File Upload: Multer

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd QuantumChain AI AI-ai
```

2. Set up the database:
- Create a MySQL database
- Import the schema from `server/database/schema.sql`

3. Configure environment variables:
- Create `.env` file in the server directory with the following variables:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=QuantumChain AI AI_db
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

5. Start the development servers:
```bash
# Start the backend server (from server directory)
npm run dev

# Start the frontend server (from client directory)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
QuantumChain AI AI-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/      # React context
│   │   └── App.js        # Main App component
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── config/           # Configuration files
│   ├── database/         # Database schema
│   └── package.json
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Secure file upload handling
- Protected routes
- Input validation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 