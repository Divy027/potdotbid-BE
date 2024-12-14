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
  Address: "0xA83B86519fEfd3E0Cbd617C1B9850842d14Ad779",
  ABI : biddingAbi,
}
export const TokenABI = tokenAbi
export const RPC = "https://sepolia.base.org";
export const Link = "0xE4aB69C077896252FAFBD49EFD26B5D171A32410";
