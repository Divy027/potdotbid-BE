
import { Request, Response, Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware";
import UserModel from "../model/UserModel";
import TokenModel from "../model/TokenModel";
import TransactionModel from "../model/TransactionModel";
import TradeModel from "../model/TradeModel";
import { getCurrentFormattedDateTime } from "./tradeRoute";
import { sign } from "jsonwebtoken";


// Create a new instance of the Express Router
const TokenRouter = Router();

// @route    POST api/tokens/create
// @desc     Token Creation
// @access   Public
TokenRouter.post("/create", authMiddleware,async (req: Request, res: Response) => {
  const {
    name,
    address,
    symbol,
    avatar,
    description,
    supply,
    marketcap,
    price,
    signature, // EVM tx hash
    social,    // Social links (e.g., Telegram and X)
    boughtAmount,// Amount of the created token bought by the owner
    ethAmount, 
  } = req.body;

  console.log(req.body)

  const owner = (req as AuthRequest).user.walletAddress;

  console.log(name)
  console.log(req.body)
  console.log(address)
  console.log(symbol)
  console.log(owner)
  console.log(signature)

  try {
    // Validate required fields
    if (!name || !address || !symbol || !owner || !signature) {
      return res.status(400).json({
        success: false,
        err: "Missing required fields: name, address, symbol, owner, or signature",
      });
    }

    // Check if the transaction (by hash) already exists
    const isTransaction = await TransactionModel.findOne({ signature });
    if (isTransaction) {
      return res.status(400).json({
        success: false,
        err: "This transaction hash is already used!",
      });
    };

    // Check if the owner exists in the user database
    const isOwner = await UserModel.findOne({ walletAddress: owner });
    if (!isOwner) {
      return res.status(404).json({
        success: false,
        err: "The owner does not exist in the database!",
      });
    }

    // Prepare social links
    const socialLinks = {
      tg: social?.tg || "", // Telegram link
      X: social?.X || "",   // X (formerly Twitter) link
    };

    // Create a new token
    const newToken = new TokenModel({
      name,
      address,
      symbol,
      avatar: avatar || "https://arweave.net/iap6ASZe2-Aw3tUFiuiCBS7DWtt0tlK2GNmn9ZVwXX8",
      description,
      supply: supply || 1e9,
      marketcap: marketcap || 0,
      price: price || 0,
      owner,
      social: socialLinks, // Add social links to the schema
    });

    // Save the token to the database
    await newToken.save();

    // Update the user's tokens created and bought information
    const updatedUser = await UserModel.findOneAndUpdate(
      { walletAddress: owner },
      {
        $push: { createdTokens: address, tokens: { address, amount: boughtAmount || 0 } }, // Add the created token to createdTokens
      },
      { new: true }
    );

    // Record the transaction
    const newTransaction = new TransactionModel({
      type: "create",
      token: address,
      user: owner,
      signature,
      amount: supply || 1e9,
      ethAmount: 0
    });

    await newTransaction.save();

    if (boughtAmount > 0) {
       
    const newTransaction = new TransactionModel({
      type: "buy",
      token: address,
      user: owner,
      signature,
      amount: boughtAmount || 0, 
      ethAmount: ethAmount || 0
    });

    await newTransaction.save();

    await TokenModel.findOneAndUpdate(
      { address },
      { $inc: { buyvolume: boughtAmount } } 
    );
    }

    // Send success response
    res.json({
      success: true,
      message: "Token successfully created!",
      token: newToken,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error creating token:", error);
    res.status(500).json({ success: false, err: "Internal Server Error" });
  }
});



// @route   POST api/tokens/buy
// @desc    Token Buy
// @access  Public
TokenRouter.post("/buy", authMiddleware, async (req: Request, res: Response) => {
  const { token, amount, signature, ethAmount } = req.body;
  const buyer = (req as AuthRequest).user.walletAddress;

  try {
    // Validate the input parameters
    if (!buyer || !token || !amount || !signature || !ethAmount) {
      return res.status(400).json({
        success: false,
        err: "Please provide buyer, token, amount, and signature!",
      });
    }

    // Check if the buyer exists
    const isBuyer = await UserModel.findOne({ walletAddress: buyer });
    if (!isBuyer) {
      return res.status(404).json({ success: false, err: "Buyer not found!" });
    }

    // Check if the token exists
    const isToken = await TokenModel.findOne({ address: token });
    if (!isToken) {
      return res.status(404).json({ success: false, err: "Token not found!" });
    }

    // Check if the transaction is already processed
    const isTransaction = await TransactionModel.findOne({ signature });
    if (isTransaction) {
      return res
        .status(400)
        .json({ success: false, err: "This signature is already used!" });
    }

    // Update the token's buy volume, market cap, and price
    const updatedToken = await TokenModel.findOneAndUpdate(
      { address: token },
      {
        $inc: {
          buyvolume: amount,
          marketcap: amount * isToken.price,
        },
      },
      { new: true }
    );

    // Update or add the token to the user's token list
    const tokenExistsInUser = isBuyer.tokens.find(
      (t: any) => t.address === token
    );

    if (tokenExistsInUser) {
      // Increment the amount of the token the user holds
      await UserModel.findOneAndUpdate(
        { walletAddress: buyer, "tokens.address": token },
        { $inc: { "tokens.$.amount": amount } }
      );
    } else {
      // Add the token to the user's token list
      await UserModel.findOneAndUpdate(
        { walletAddress: buyer },
        { $push: { tokens: { address: token, amount } } }
      );
    }

    // Create a new transaction for the purchase
    const newTransaction = new TransactionModel({
      type: "buy",
      token,
      user: buyer,
      signature,
      amount,
      ethAmount
    });

    await newTransaction.save();

    res.json({
      success: true,
      message: "Token purchase successful!",
      token: updatedToken,
    });
  } catch (error) {
    console.error("Error processing buy route:", error);
    res.status(500).json({ success: false, err: "Internal Server Error" });
  }
});

// @route   POST api/tokens/sell
// @desc    Token sell
// @access  Public
TokenRouter.post("/sell", authMiddleware,  async (req: Request, res: Response) => {
  const { token, amount, signature, ethAmount } = req.body;

  const seller = (req as AuthRequest).user.walletAddress;

  try {
    // Validate input
    if (!seller || !token || !amount || !signature || !ethAmount) {
      return res
        .status(400)
        .json({ success: false, err: "Please provide seller, token, amount, and signature!" });
    }

    // Check if the seller exists
    const isSeller = await UserModel.findOne({ walletAddress: seller });
    if (!isSeller) {
      return res.status(404).json({ success: false, err: "Seller not found!" });
    }

    // Check if the token exists
    const isToken = await TokenModel.findOne({ address: token });
    if (!isToken) {
      return res.status(404).json({ success: false, err: "Token not found!" });
    }

    // Check if the transaction has already been processed
    const isTransaction = await TransactionModel.findOne({ signature });
    if (isTransaction) {
      return res
        .status(400)
        .json({ success: false, err: "This signature is already used!" });
    }

    // Ensure the seller has enough tokens to sell
    const userToken = isSeller.tokens.find((t: any) => t.address === token);
    if (!userToken || userToken.amount < amount) {
      return res.status(400).json({
        success: false,
        err: "Seller does not have enough tokens to sell!",
      });
    }

    // Calculate updated token supply and price
    const newMarketCap = isToken.marketcap - amount * isToken.price;

    // Update token information
    const updatedToken = await TokenModel.findOneAndUpdate(
      { address: token },
      {
        $inc: { sellvolume: amount },
        $set: {
          marketcap: Math.max(newMarketCap, 0), // Avoid negative market cap
        },
      },
      { new: true }
    );

    // Deduct tokens from the seller's balance
    await UserModel.findOneAndUpdate(
      { walletAddress: seller, "tokens.address": token },
      {
        $inc: { "tokens.$.amount": -amount },
      }
    );

    // If seller has no tokens left, remove the token from their token list
    const updatedSeller: any = await UserModel.findOne({ walletAddress: seller });
    if (updatedSeller.tokens.find((t: any) => t.address === token)?.amount === 0) {
      await UserModel.findOneAndUpdate(
        { walletAddress: seller },
        { $pull: { tokens: { address: token } } }
      );
    }

    // Log the transaction
    const newTransaction = new TransactionModel({
      type: "sell",
      token,
      user: seller,
      signature,
      amount,
      ethAmount
    });

    await newTransaction.save();

    res.json({
      success: true,
      message: "Token sell successful!",
      token: updatedToken,
    });
  } catch (error) {
    console.error("Error processing sell route:", error);
    res.status(500).json({ success: false, err: "Internal Server Error" });
  }
});


// @route   GET api/tokens/getAll
// @desc    Get all tokens
// @acess   Public
TokenRouter.get('/getAll', async (req: Request, res: Response) => {
  console.log('getting all tokens')
  try {
    const tokens = await TokenModel.find({});
    let resTokens = [];
    for (let i = 0; i < tokens.length; i++) {
      const buy = await TransactionModel.find({type: 'buy', token: tokens[i].address});
      let buyCount = 0;
      if(buy) buyCount = buy.length;
      const sell = await TransactionModel.find({type: 'sell', token: tokens[i].address});
      let sellCount = 0;
      if(sell) sellCount = sell.length;
      const newData = {
        symbol: tokens[i].symbol,
        image: tokens[i].avatar,
        creator: tokens[i].owner,
        liquidity: tokens[i].supply / 10 ** 9,
        marketcap: tokens[i].marketcap / 10 ** 9,
        txnsBuy: buyCount,
        txnsSell: sellCount,
        address: tokens[i].address,
        name: tokens[i].name,
        price: tokens[i].price,
        buyVolume: tokens[i].buyvolume?tokens[i].buyvolume:0,
        sellVolume: tokens[i].sellvolume?tokens[i].sellvolume:0,
        status: tokens[i].status,
        social: tokens[i].social,
        description: tokens[i].description
      }
      resTokens.push(newData);
    }
    res.json({success: true, tokens: resTokens})
  } catch (error) {
    console.log('get all => ', error);
    res.status(500).json({success: false})
  }
})

interface DataPoint {
  timestamp: number;
  price: number;
  token?: string;
  volume?: number
  supply?: number;
}

interface IntervalResult {
  open: number;
  close: number;
  high: number;
  low: number;
  date: string;
  volume: number
}


function processIntervals(data: DataPoint[]): IntervalResult[] {
  // Step 1: Sort the array by timestamp
  data.sort((a, b) => a.timestamp - b.timestamp);

  // Step 2: Initialize variables
  const intervalDuration = 20 * 1000; // 5 minutes in milliseconds
  const result: IntervalResult[] = [];
  let intervalStart: number | null = null;
  let intervalEnd: number | null = null;
  let startPrice: number | null = null;
  let endPrice: number | null = null;
  let maxPrice: number = -Infinity;
  let minPrice: number = Infinity;
  let lastClosePrice: number | null = null;

  // Step 3: Process each entry in the sorted array
  data.forEach((entry, index) => {
    const currentTime = entry.timestamp;
    

    // Initialize interval start if not set
    if (intervalStart === null) {
      intervalStart = currentTime;
      startPrice = entry.price;
    }

    // Determine if the current entry is within the current interval
    if (currentTime < intervalStart + intervalDuration) {
      // Update end price and other statistics within the interval
      intervalEnd = currentTime;
      endPrice = entry.price;
      maxPrice = Math.max(maxPrice, entry.price);
      minPrice = Math.min(minPrice, entry.price);
    } else {
      // Push the previous interval's data to result
      result.push({
        open: lastClosePrice!,
        close: endPrice!,
        high: maxPrice,
        low: minPrice,
        date: getCurrentFormattedDateTime(currentTime),
        volume: entry.volume!
      });
      lastClosePrice = endPrice

      // Reset for the new interval
      intervalStart = currentTime;
      startPrice = entry.price;
      intervalEnd = currentTime;
      endPrice = entry.price;
      maxPrice = entry.price;
      minPrice = entry.price;
    }

    // Handle the last entry to ensure it gets included
    if (index === data.length - 1) {
      result.push({
        open: startPrice!,
        close: endPrice!,
        high: maxPrice,
        low: minPrice,
        date: getCurrentFormattedDateTime(currentTime),
        volume: entry.volume!
      });
    }
  });

  return result;
}

// @route   GET api/tokens/:tokenId
// @desc    Get one tokens info
// @access  Public
TokenRouter.get('/:tokenId', async (req: Request, res: Response) => {
  const {tokenId} = req.params;
  const token = await TokenModel.findOne({address: tokenId});
  if(!token) return res.status(500).json({success: false, err: "This token does not exist!"});
  res.json({token})

})

export default TokenRouter;