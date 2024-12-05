"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const UserModel_1 = __importDefault(require("../model/UserModel"));
const TokenModel_1 = __importDefault(require("../model/TokenModel"));
const TransactionModel_1 = __importDefault(require("../model/TransactionModel"));
const TradeModel_1 = __importDefault(require("../model/TradeModel"));
const tradeRoute_1 = require("./tradeRoute");
// Create a new instance of the Express Router
const TokenRouter = (0, express_1.Router)();
// @route    POST api/tokens/create
// @desc     Token Creation
// @access   Public
TokenRouter.post("/create", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, address, symbol, avatar, description, supply, marketcap, price, signature, // EVM tx hash
    social, // Social links (e.g., Telegram and X)
    boughtAmount, // Amount of the created token bought by the owner
     } = req.body;
    console.log(req.body);
    const owner = req.user.walletAddress;
    console.log(name);
    console.log(req.body);
    console.log(address);
    console.log(symbol);
    console.log(owner);
    console.log(signature);
    try {
        // Validate required fields
        if (!name || !address || !symbol || !owner || !signature) {
            return res.status(400).json({
                success: false,
                err: "Missing required fields: name, address, symbol, owner, or signature",
            });
        }
        // Check if the transaction (by hash) already exists
        const isTransaction = yield TransactionModel_1.default.findOne({ signature });
        if (isTransaction) {
            return res.status(400).json({
                success: false,
                err: "This transaction hash is already used!",
            });
        }
        // Check if the owner exists in the user database
        const isOwner = yield UserModel_1.default.findOne({ walletAddress: owner });
        if (!isOwner) {
            return res.status(404).json({
                success: false,
                err: "The owner does not exist in the database!",
            });
        }
        // Prepare social links
        const socialLinks = {
            tg: (social === null || social === void 0 ? void 0 : social.tg) || "", // Telegram link
            X: (social === null || social === void 0 ? void 0 : social.X) || "", // X (formerly Twitter) link
        };
        // Create a new token
        const newToken = new TokenModel_1.default({
            name,
            address,
            symbol,
            avatar: avatar || "https://arweave.net/iap6ASZe2-Aw3tUFiuiCBS7DWtt0tlK2GNmn9ZVwXX8",
            description,
            supply: supply || Math.pow(10, 9),
            marketcap: marketcap || 0,
            price: price || 0,
            owner,
            social: socialLinks, // Add social links to the schema
        });
        // Save the token to the database
        yield newToken.save();
        // Update the user's tokens created and bought information
        const updatedUser = yield UserModel_1.default.findOneAndUpdate({ walletAddress: owner }, {
            $push: { createdTokens: address, tokens: { address, amount: boughtAmount || 0 } }, // Add the created token to createdTokens
        }, { new: true });
        // Record the transaction
        const newTransaction = new TransactionModel_1.default({
            type: "create",
            token: address,
            user: owner,
            signature,
            amount: supply || 0,
        });
        yield newTransaction.save();
        if (boughtAmount > 0) {
            const newTransaction = new TransactionModel_1.default({
                type: "buy",
                token: address,
                user: owner,
                signature,
                amount: boughtAmount || 0,
            });
            yield newTransaction.save();
            yield TokenModel_1.default.findOneAndUpdate({ address }, { $inc: { buyvolume: boughtAmount } });
        }
        // Send success response
        res.json({
            success: true,
            message: "Token successfully created!",
            token: newToken,
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Error creating token:", error);
        res.status(500).json({ success: false, err: "Internal Server Error" });
    }
}));
// @route   POST api/tokens/buy
// @desc    Token Buy
// @access  Public
TokenRouter.post("/buy", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, amount, signature } = req.body;
    const buyer = req.user.walletAddress;
    try {
        // Validate the input parameters
        if (!buyer || !token || !amount || !signature) {
            return res.status(400).json({
                success: false,
                err: "Please provide buyer, token, amount, and signature!",
            });
        }
        // Check if the buyer exists
        const isBuyer = yield UserModel_1.default.findOne({ walletAddress: buyer });
        if (!isBuyer) {
            return res.status(404).json({ success: false, err: "Buyer not found!" });
        }
        // Check if the token exists
        const isToken = yield TokenModel_1.default.findOne({ address: token });
        if (!isToken) {
            return res.status(404).json({ success: false, err: "Token not found!" });
        }
        // Check if the transaction is already processed
        const isTransaction = yield TransactionModel_1.default.findOne({ signature });
        if (isTransaction) {
            return res
                .status(400)
                .json({ success: false, err: "This signature is already used!" });
        }
        // Update the token's buy volume, market cap, and price
        const updatedToken = yield TokenModel_1.default.findOneAndUpdate({ address: token }, {
            $inc: {
                buyvolume: amount,
                marketcap: amount * isToken.price,
            },
        }, { new: true });
        // Update or add the token to the user's token list
        const tokenExistsInUser = isBuyer.tokens.find((t) => t.address === token);
        if (tokenExistsInUser) {
            // Increment the amount of the token the user holds
            yield UserModel_1.default.findOneAndUpdate({ walletAddress: buyer, "tokens.address": token }, { $inc: { "tokens.$.amount": amount } });
        }
        else {
            // Add the token to the user's token list
            yield UserModel_1.default.findOneAndUpdate({ walletAddress: buyer }, { $push: { tokens: { address: token, amount } } });
        }
        // Create a new transaction for the purchase
        const newTransaction = new TransactionModel_1.default({
            type: "buy",
            token,
            user: buyer,
            signature,
            amount,
        });
        yield newTransaction.save();
        res.json({
            success: true,
            message: "Token purchase successful!",
            token: updatedToken,
        });
    }
    catch (error) {
        console.error("Error processing buy route:", error);
        res.status(500).json({ success: false, err: "Internal Server Error" });
    }
}));
// @route   POST api/tokens/sell
// @desc    Token sell
// @access  Public
TokenRouter.post("/sell", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { token, amount, signature } = req.body;
    const seller = req.user.walletAddress;
    try {
        // Validate input
        if (!seller || !token || !amount || !signature) {
            return res
                .status(400)
                .json({ success: false, err: "Please provide seller, token, amount, and signature!" });
        }
        // Check if the seller exists
        const isSeller = yield UserModel_1.default.findOne({ walletAddress: seller });
        if (!isSeller) {
            return res.status(404).json({ success: false, err: "Seller not found!" });
        }
        // Check if the token exists
        const isToken = yield TokenModel_1.default.findOne({ address: token });
        if (!isToken) {
            return res.status(404).json({ success: false, err: "Token not found!" });
        }
        // Check if the transaction has already been processed
        const isTransaction = yield TransactionModel_1.default.findOne({ signature });
        if (isTransaction) {
            return res
                .status(400)
                .json({ success: false, err: "This signature is already used!" });
        }
        // Ensure the seller has enough tokens to sell
        const userToken = isSeller.tokens.find((t) => t.address === token);
        if (!userToken || userToken.amount < amount) {
            return res.status(400).json({
                success: false,
                err: "Seller does not have enough tokens to sell!",
            });
        }
        // Calculate updated token supply and price
        const newMarketCap = isToken.marketcap - amount * isToken.price;
        // Update token information
        const updatedToken = yield TokenModel_1.default.findOneAndUpdate({ address: token }, {
            $inc: { sellvolume: amount },
            $set: {
                marketcap: Math.max(newMarketCap, 0), // Avoid negative market cap
            },
        }, { new: true });
        // Deduct tokens from the seller's balance
        yield UserModel_1.default.findOneAndUpdate({ walletAddress: seller, "tokens.address": token }, {
            $inc: { "tokens.$.amount": -amount },
        });
        // If seller has no tokens left, remove the token from their token list
        const updatedSeller = yield UserModel_1.default.findOne({ walletAddress: seller });
        if (((_a = updatedSeller.tokens.find((t) => t.address === token)) === null || _a === void 0 ? void 0 : _a.amount) === 0) {
            yield UserModel_1.default.findOneAndUpdate({ walletAddress: seller }, { $pull: { tokens: { address: token } } });
        }
        // Log the transaction
        const newTransaction = new TransactionModel_1.default({
            type: "sell",
            token,
            user: seller,
            signature,
            amount,
        });
        yield newTransaction.save();
        res.json({
            success: true,
            message: "Token sell successful!",
            token: updatedToken,
        });
    }
    catch (error) {
        console.error("Error processing sell route:", error);
        res.status(500).json({ success: false, err: "Internal Server Error" });
    }
}));
// @route   GET api/tokens/getAll
// @desc    Get all tokens
// @acess   Public
TokenRouter.get('/getAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('getting all tokens');
    try {
        const tokens = yield TokenModel_1.default.find({});
        let resTokens = [];
        for (let i = 0; i < tokens.length; i++) {
            const buy = yield TransactionModel_1.default.find({ type: 'buy', token: tokens[i].address });
            let buyCount = 0;
            if (buy)
                buyCount = buy.length;
            const sell = yield TransactionModel_1.default.find({ type: 'sell', token: tokens[i].address });
            let sellCount = 0;
            if (sell)
                sellCount = sell.length;
            const newData = {
                tokenSymbol: tokens[i].symbol,
                tokenImage: tokens[i].avatar,
                creator: tokens[i].owner,
                liquidity: tokens[i].supply / Math.pow(10, 9),
                marketcap: tokens[i].marketcap / Math.pow(10, 9),
                txnsBuy: buyCount,
                txnsSell: sellCount,
                tokenAddr: tokens[i].address,
                tokenName: tokens[i].name,
                price: tokens[i].price,
                buyVolume: tokens[i].buyvolume ? tokens[i].buyvolume : 0,
                sellVolume: tokens[i].sellvolume ? tokens[i].sellvolume : 0,
                status: tokens[i].status,
                social: tokens[i].social,
                description: tokens[i].description
            };
            resTokens.push(newData);
        }
        res.json({ success: true, tokens: resTokens });
    }
    catch (error) {
        console.log('get all => ', error);
        res.status(500).json({ success: false });
    }
}));
function processIntervals(data) {
    // Step 1: Sort the array by timestamp
    data.sort((a, b) => a.timestamp - b.timestamp);
    // Step 2: Initialize variables
    const intervalDuration = 20 * 1000; // 5 minutes in milliseconds
    const result = [];
    let intervalStart = null;
    let intervalEnd = null;
    let startPrice = null;
    let endPrice = null;
    let maxPrice = -Infinity;
    let minPrice = Infinity;
    let lastClosePrice = null;
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
        }
        else {
            // Push the previous interval's data to result
            result.push({
                open: lastClosePrice,
                close: endPrice,
                high: maxPrice,
                low: minPrice,
                date: (0, tradeRoute_1.getCurrentFormattedDateTime)(currentTime),
                volume: entry.volume
            });
            lastClosePrice = endPrice;
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
                open: startPrice,
                close: endPrice,
                high: maxPrice,
                low: minPrice,
                date: (0, tradeRoute_1.getCurrentFormattedDateTime)(currentTime),
                volume: entry.volume
            });
        }
    });
    return result;
}
// @route   GET api/tokens/:tokenId
// @desc    Get one tokens info
// @access  Public
TokenRouter.get('/:tokenId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tokenId } = req.params;
    const token = yield TokenModel_1.default.findOne({ address: tokenId });
    if (!token)
        return res.status(500).json({ success: false, err: "This token does not exist!" });
    const tradeHis = yield TradeModel_1.default.find({ token: tokenId });
    if (tradeHis.length === 0)
        return res.status(500).json({ success: false, err: "This token has no data!" });
    //@ts-ignore
    const newArr = processIntervals(tradeHis);
    res.json({ trades: newArr, token });
}));
exports.default = TokenRouter;
