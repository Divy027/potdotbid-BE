require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.27",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: 'https://eth-mainnet.g.alchemy.com/v2/xkMkq3diOiuGpkCz7bSuJKEj95i4eh4B',
      },
      
    },
    baseSepolia: {
      url: `https://sepolia.base.org`, // Base Sepolia network RPC URL
      accounts: [`0x${process.env.PRIVATE_KEY}`], // Private key from environment variable
      chainId: 84532, // Base Sepolia's chain ID
    },
  },
};
