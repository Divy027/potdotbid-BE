import mongoose, { Types } from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    default: ""
  },
  walletAddress: { 
    type: String, 
    required: true,
    unique: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  tokens: [
    {
      address: {
        type: String,
        ref: 'token'
      },
      amount: {
        type: Number,
        required: true
      }
    }
  ],
  createdTokens: [
    {
      type: String, // Token address
      ref: 'token'
    }
  ]
});


const UserModel = mongoose.model("user", UserSchema);

export default UserModel;
