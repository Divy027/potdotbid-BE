import dotenv from "dotenv";
dotenv.config();
import biddingAbi from "./ABI/Bidding.json";
import tokenAbi from "./ABI/Token.json"
try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

export const MONGO_URL = process.env.MONGO_URL;
export const PORT = process.env.PORT || 9000
export const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
export const pvt_key = process.env.PVT_KEY || "";
export const Bidding = {
  Address: "0x745C456D05F7e8f8E66bfeDF3183D0Ba1952b805",
  ABI : biddingAbi,
}
export const TokenABI = tokenAbi
export const RPC = "https://eth-sepolia.public.blastapi.io";
export const Link = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
