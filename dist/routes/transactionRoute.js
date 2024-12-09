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
const TransactionModel_1 = __importDefault(require("../model/TransactionModel"));
const TransactionRouter = (0, express_1.Router)();
// @route    GET api/transactions/:tokenAddress
// @desc     Get all transactions for a specific token address
// @access   Public
TransactionRouter.get("/:tokenAddress", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tokenAddress } = req.params;
    if (!tokenAddress) {
        return res.status(400).json({ msg: "Token address is required" });
    }
    try {
        const transactions = yield TransactionModel_1.default.find({ token: tokenAddress }).sort({ timestamp: -1 });
        if (!transactions.length) {
            return res.status(404).json({ msg: "No transactions found for this token address" });
        }
        res.status(200).json({ transactions });
    }
    catch (error) {
        console.error("Error fetching transactions =>", error);
        res.status(500).json({ err: "Server error. Please try again later." });
    }
}));
exports.default = TransactionRouter;
