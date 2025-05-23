import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { PORT, connectMongoDB } from "./config";
import http from "http";
import UserRouter from "./routes/userRoute";
import TokenRouter from "./routes/tokenRoute";

import cron from 'node-cron';
import { updatePermins } from "./routes/tradeRoute";
import TransactionRouter from "./routes/transactionRoute";
import { listenEvent } from "./contracts";


// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectMongoDB();

// Create an instance of the Express application
const app = express();
const whitelist = ["http://localhost:3000", "https://www.pot.bid"];
const corsOptions = {
  origin: '*', // Allow all origins or restrict to your frontend domain
  methods: ['GET', 'POST', 'OPTIONS'], // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], // Include 'x-auth-token'
  credentials: false, // Set to true if cookies are required
};

app.use(cors(corsOptions));

// Serve static files from the 'public' folder

// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);

// cron.schedule(`* * * * * *`, updatePermins)

// Define routes for different API endpoints
app.use("/api/users", UserRouter);
app.use("/api/tokens", TokenRouter);
app.use("/api/transaction",TransactionRouter);

listenEvent()

// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
  res.send("Backend Server is Running now!");
});

// Start the Express server to listen on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
