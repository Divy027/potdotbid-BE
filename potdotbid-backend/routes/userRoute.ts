import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import User from "../model/UserModel";
import { authMiddleware, AuthRequest } from "../middleware";
import { ethers } from "ethers";
import UserModel from "../model/UserModel";
import { JWT_SECRET } from "../config";

const nonces: Record<string, string> = {}; // Store nonces for wallet addresses temporarily

const UserRouter = Router();

// @route    POST api/users/register
// @desc     Register user with wallet address verification
// @access   Public
UserRouter.post("/register", async (req: Request, res: Response) => {
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
    const recoveredAddress = ethers.utils.verifyMessage(nonce, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ msg: "Signature verification failed" });
    }

    // If the signature is valid, check if the user already exists
    const user = await UserModel.findOne({ walletAddress });
    if (user) {
      const payload = {
        walletAddress: user.walletAddress,
        id: user._id
      }
      const token = jwt.sign(payload, JWT_SECRET);
      return res.json({ token, user });
    } else {
      // If the user doesn't exist, create a new one
      const newUser = new UserModel({ walletAddress });
      const savedUser = await newUser.save();

      const payload = {
        walletAddress: savedUser.walletAddress,
        id: savedUser._id
      };
      const token = jwt.sign(payload, JWT_SECRET);

      res.json({ token, user: savedUser });
    }
  } catch (error) {
    console.error("Registering error =>", error);
    res.status(500).json({ err: error });
  }
});

// @route    POST api/users/nonce
// @desc     Generate a nonce for wallet address
// @access   Public
UserRouter.post("/nonce", async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ msg: "Wallet address is required" });
  }

  // Generate a random nonce
  const nonce = `Sign this message to verify your wallet: ${Math.random()}`;
  nonces[walletAddress] = nonce;

  // Send the nonce to the client
  res.status(200).json({ nonce });
});

// @route    POST api/users/update
// @desc     Update user info
// @access   Public
UserRouter.post("/update", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.user;
  console.log('user id => ', id);
  console.log('user info => ', req.user)
  const { username } = req.body;
  try {
    const user = await UserModel.findById(id);
    if (!user) return res.status(500).json({err: "This user does not exist!"});
    const updateUser = await UserModel.findByIdAndUpdate(id, { username: username }, {new: true});
    
    res.json({user: updateUser});
    
  } catch (error) {
    console.log("updating user error => ", error);
    res.status(500).json({err: error})
  }
});

export default UserRouter;
