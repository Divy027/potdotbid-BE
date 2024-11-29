require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      forking: {
        url: 'https://eth-mainnet.g.alchemy.com/v2/xkMkq3diOiuGpkCz7bSuJKEj95i4eh4B',

      },

    },
  }
};
