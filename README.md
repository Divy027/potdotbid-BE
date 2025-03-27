# PotDotBid Backend

This is the backend service for **PotDotBid**, It is built using **Node.js** and **MongoDB** and provides APIs to store user details, trade history, and includes a script to register **Chainlink Automation** once a token migrates.

## Features
- User authentication and authorization using JWT.
- Stores user details and trade history.
- Chainlink Automation registration script.
- REST API built with Express.js.
- MongoDB for data storage.

## Tech Stack
- **Node.js**
- **Express.js**
- **MongoDB (Mongoose ORM)**
- **JWT Authentication**

## Installation

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

### Setup
Clone the repository:
```sh
 git clone https://github.com/Divy027/potdotbid-BE.git
 cd potdotbid-BE
```

Install dependencies:
```sh
 npm install
```

## Environment Variables
Create a `.env` file in the root directory and add the following:

```env
JWT_SECRET=
MONGO_URL=
PORT=
PVT_KEY=
RPC_ENDPOINT=
```

> ⚠️ **Security Note:** Do not expose your `.env` file publicly. Use environment variables securely in a `.env.example` file for reference.

## Running the Server
Start the development server:
```sh
 npm run dev
```

The server will be running on `http://localhost:5050` (or the specified `PORT` in `.env`).

## API Endpoints

### User Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get a JWT token

### Trade History
- `GET /api/trades` - Fetch all trade history
- `POST /api/trades` - Add new trade history entry

### Chainlink Automation
- `POST /api/automation/register` - Register automation once token migrates

## Contributing
Feel free to contribute by submitting pull requests or opening issues.

## License
This project is licensed under the MIT License.

---
**Repository:** [GitHub](https://github.com/Divy027/potdotbid-BE)

