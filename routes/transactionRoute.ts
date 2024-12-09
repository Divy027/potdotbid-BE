import { Request, Response, Router } from "express";
import TransactionModel from "../model/TransactionModel";

const TransactionRouter = Router();

// @route    GET api/transactions/:tokenAddress
// @desc     Get all transactions for a specific token address
// @access   Public
TransactionRouter.get("/:tokenAddress", async (req: Request, res: Response) => {
  const { tokenAddress } = req.params;

  if (!tokenAddress) {
    return res.status(400).json({ msg: "Token address is required" });
  }

  try {
    const transactions = await TransactionModel.find({ token: tokenAddress }).sort({ timestamp: -1 });

    if (!transactions.length) {
      return res.status(404).json({ msg: "No transactions found for this token address" });
    }

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions =>", error);
    res.status(500).json({ err: "Server error. Please try again later." });
  }
});

export default TransactionRouter;
