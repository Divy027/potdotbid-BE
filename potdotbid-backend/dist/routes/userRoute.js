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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("../middleware");
const ethers_1 = require("ethers");
const UserModel_1 = __importDefault(require("../model/UserModel"));
const config_1 = require("../config");
const nonces = {}; // Store nonces for wallet addresses temporarily
const UserRouter = (0, express_1.Router)();
// @route    POST api/users/register
// @desc     Register user with wallet address verification
// @access   Public
UserRouter.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { walletAddress, signature, nonce } = req.body;
    if (!walletAddress || !signature || !nonce) {
        return res.status(400).json({ msg: "Wallet address, signature, and nonce are required" });
    }
    try {
        // Check if nonce is valid
        if (nonces[walletAddress] !== nonce) {
            return res.status(400).json({ msg: "Invalid or expired nonce" });
        }
        // Verify the signature using ethers.js
        const recoveredAddress = ethers_1.ethers.utils.verifyMessage(nonce, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(401).json({ msg: "Signature verification failed" });
        }
        // If the signature is valid, check if the user already exists
        const user = yield UserModel_1.default.findOne({ walletAddress });
        if (user) {
            const payload = {
                walletAddress: user.walletAddress,
                id: user._id
            };
            const token = jsonwebtoken_1.default.sign(payload, config_1.JWT_SECRET);
            return res.json({ token, user });
        }
        else {
            // If the user doesn't exist, create a new one
            const newUser = new UserModel_1.default({ walletAddress });
            const savedUser = yield newUser.save();
            const payload = {
                walletAddress: savedUser.walletAddress,
                id: savedUser._id
            };
            const token = jsonwebtoken_1.default.sign(payload, config_1.JWT_SECRET);
            res.json({ token, user: savedUser });
        }
    }
    catch (error) {
        console.error("Registering error =>", error);
        res.status(500).json({ err: error });
    }
}));
// @route    POST api/users/nonce
// @desc     Generate a nonce for wallet address
// @access   Public
UserRouter.post("/nonce", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ msg: "Wallet address is required" });
    }
    // Generate a random nonce
    const nonce = `Sign this message to verify your wallet: ${Math.random()}`;
    nonces[walletAddress] = nonce;
    // Send the nonce to the client
    res.status(200).json({ nonce });
}));
// @route    POST api/users/update
// @desc     Update user info
// @access   Public
UserRouter.post("/update", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    console.log('user id => ', id);
    console.log('user info => ', req.user);
    const { username } = req.body;
    try {
        const user = yield UserModel_1.default.findById(id);
        if (!user)
            return res.status(500).json({ err: "This user does not exist!" });
        const updateUser = yield UserModel_1.default.findByIdAndUpdate(id, { username: username }, { new: true });
        res.json({ user: updateUser });
    }
    catch (error) {
        console.log("updating user error => ", error);
        res.status(500).json({ err: error });
    }
}));
exports.default = UserRouter;
