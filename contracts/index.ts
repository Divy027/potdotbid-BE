import { ethers, providers } from 'ethers';
import { Bidding, Link, pvt_key, RPC, TokenABI } from '../config/config';
import TokenModel from '../model/TokenModel';

const provider = new ethers.providers.JsonRpcProvider(RPC);


export async function listenEvent() {
  try {
    // Connect to the blockchain network
   
    // Connect to the smart contract
    const contract = new ethers.Contract(Bidding.Address, Bidding.ABI, provider);

    console.log("Listening for TokenLaunched events...");

    //await registerUpkeep("0xB56c478071b1663ED2c201cBAE0fc08Dbbe8d24e")

    // Listen for the TokenLaunched event
    contract.on("TokenLaunched", async (token) => {
      console.log(`Token launched: ${token}`);

      // Execute upkeep registration logic
      try {
        await TokenModel.findOneAndUpdate(
          { token },
          { $set: {status: "completed" } } 
        );
        await registerUpkeep(token);
      } catch (err) {
        console.error(`Error during upkeep registration for token ${token}:`, err);
      }
    });
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

// Register upkeep for a token
async function registerUpkeep(tokenAddress: string) {
  console.log(`Registering upkeep for token: ${tokenAddress}`);

  // Example logic for upkeep registration
  // 1. Send 5 LINK tokens
  // 2. Record the upkeep registration timestamp
  const wallet = new ethers.Wallet(pvt_key);

  // Connect the wallet to the provider
  const signer = wallet.connect(provider);

  const Owner = await signer.getAddress();

  console.log(wallet.address);
  const linkToken = new ethers.Contract(Link, TokenABI, signer)
  // send link token to token contract
  const tx = await linkToken.transfer(tokenAddress, ethers.utils.parseEther("0.11"))
  await tx.wait()

  // link token balance of token contract

  let linkBlanceOftokenContract = await linkToken.balanceOf(tokenAddress);
  console.log("link balance of token (before register upkeep) : ", linkBlanceOftokenContract.toString(), tokenAddress)

  // call registerAndPredictID to setup upkeep automatlcy
  const _token = new ethers.Contract(tokenAddress, TokenABI, signer)

  const registrationParams = {
    upkeepContract: tokenAddress, // address of token contract
    amount: ethers.utils.parseEther("0.1"), // uint96

    adminAddress: Owner, // address msg.send addrses
    gasLimit: 500000, // uint32
    triggerType: 0, // uint8

    billingToken: linkToken,

    name: "potdotbid upkeep", // string
    encryptedEmail: "0x", // bytes
    checkData: "0x", // bytes
    triggerConfig: "0x", // bytes
    offchainConfig: "0x", // bytes


};


  const tx2 = await _token.registerAndPredictID(registrationParams);
  await tx2.wait()

  linkBlanceOftokenContract = await linkToken.balanceOf(tokenAddress);
  console.log("link balance of token (after register upkeep) : ", linkBlanceOftokenContract.toString(), tokenAddress)
  const timestamp = new Date().toISOString();

  // Example: Log the action (replace with your actual database or blockchain interaction logic)
  console.log(`Upkeep registered at ${timestamp} for token: ${tokenAddress}`);

  await TokenModel.findOneAndUpdate(
    { tokenAddress },
    { $set: { countdown: timestamp } } 
  );


  // Placeholder: Add your LINK token transfer and DB interaction here
}

