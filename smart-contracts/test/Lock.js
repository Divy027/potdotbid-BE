const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokenAbi = [
  // Replace with the actual ABI of your token contract
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transfer(address recipient, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)",
  // Add more functions as needed
];

const upkeepTokenAbi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_initialSupply",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "have",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "want",
        "type": "address"
      }
    ],
    "name": "OnlyVRFWrapperCanFulfill",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UpkeepNotNeeded",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address[]",
        "name": "selectedAddresses",
        "type": "address[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AddressesSelectedDaily",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "holder",
        "type": "address"
      }
    ],
    "name": "HolderAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "SellAttempted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DAILY_SELECTION_INTERVAL",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "callbackGasLimit",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "checkUpkeep",
    "outputs": [
      {
        "internalType": "bool",
        "name": "upkeepNeeded",
        "type": "bool"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentSelectedAddresses",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEligibleAddresses",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getHolders",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLinkToken",
    "outputs": [
      {
        "internalType": "contract LinkTokenInterface",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "i_link",
    "outputs": [
      {
        "internalType": "contract LinkTokenInterface",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "i_registrar",
    "outputs": [
      {
        "internalType": "contract AutomationRegistrarInterface",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "i_vrfV2PlusWrapper",
    "outputs": [
      {
        "internalType": "contract IVRFV2PlusWrapper",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastSelectionTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "numWords",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "performUpkeep",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_randomWords",
        "type": "uint256[]"
      }
    ],
    "name": "rawFulfillRandomWords",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "bytes",
            "name": "encryptedEmail",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "upkeepContract",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "gasLimit",
            "type": "uint32"
          },
          {
            "internalType": "address",
            "name": "adminAddress",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "triggerType",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "checkData",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "triggerConfig",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "offchainConfig",
            "type": "bytes"
          },
          {
            "internalType": "uint96",
            "name": "amount",
            "type": "uint96"
          }
        ],
        "internalType": "struct RegistrationParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "registerAndPredictID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requestConfirmations",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "selectedAddresses",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_isLauched",
        "type": "bool"
      }
    ],
    "name": "setLaunchedOnDex",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]


async function getBalance(address) {
  // console.log("addr : ", address)
  let b = await ethers.provider.getBalance(address);
  b = ethers.formatEther(b);
  return b
}

const routerABI = [{ "inputs": [{ "internalType": "address", "name": "_factory", "type": "address" }, { "internalType": "address", "name": "_WETH", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "WETH", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint256", "name": "amountADesired", "type": "uint256" }, { "internalType": "uint256", "name": "amountBDesired", "type": "uint256" }, { "internalType": "uint256", "name": "amountAMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountBMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "addLiquidity", "outputs": [{ "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "amountB", "type": "uint256" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amountTokenDesired", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "addLiquidityETH", "outputs": [{ "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "factory", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint256", "name": "reserveIn", "type": "uint256" }, { "internalType": "uint256", "name": "reserveOut", "type": "uint256" }], "name": "getAmountIn", "outputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }], "stateMutability": "pure", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "reserveIn", "type": "uint256" }, { "internalType": "uint256", "name": "reserveOut", "type": "uint256" }], "name": "getAmountOut", "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }], "stateMutability": "pure", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }], "name": "getAmountsIn", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }], "name": "getAmountsOut", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "reserveA", "type": "uint256" }, { "internalType": "uint256", "name": "reserveB", "type": "uint256" }], "name": "quote", "outputs": [{ "internalType": "uint256", "name": "amountB", "type": "uint256" }], "stateMutability": "pure", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountAMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountBMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "removeLiquidity", "outputs": [{ "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "amountB", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "removeLiquidityETH", "outputs": [{ "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "removeLiquidityETHSupportingFeeOnTransferTokens", "outputs": [{ "internalType": "uint256", "name": "amountETH", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bool", "name": "approveMax", "type": "bool" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "removeLiquidityETHWithPermit", "outputs": [{ "internalType": "uint256", "name": "amountToken", "type": "uint256" }, { "internalType": "uint256", "name": "amountETH", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountTokenMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountETHMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bool", "name": "approveMax", "type": "bool" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", "outputs": [{ "internalType": "uint256", "name": "amountETH", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint256", "name": "liquidity", "type": "uint256" }, { "internalType": "uint256", "name": "amountAMin", "type": "uint256" }, { "internalType": "uint256", "name": "amountBMin", "type": "uint256" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bool", "name": "approveMax", "type": "bool" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "removeLiquidityWithPermit", "outputs": [{ "internalType": "uint256", "name": "amountA", "type": "uint256" }, { "internalType": "uint256", "name": "amountB", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapETHForExactTokens", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactETHForTokens", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactETHForTokensSupportingFeeOnTransferTokens", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactTokensForETH", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactTokensForETHSupportingFeeOnTransferTokens", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactTokensForTokens", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapExactTokensForTokensSupportingFeeOnTransferTokens", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint256", "name": "amountInMax", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapTokensForExactETH", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }, { "internalType": "uint256", "name": "amountInMax", "type": "uint256" }, { "internalType": "address[]", "name": "path", "type": "address[]" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }], "name": "swapTokensForExactTokens", "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }]



describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, feeReciver] = await ethers.getSigners();

    const maxPurchaseAmount = ethers.parseEther("20");
    const BondingCurve = await ethers.getContractFactory("BondingCurve");
    const bondingCurve = await BondingCurve.deploy(
      feeReciver.address,
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      maxPurchaseAmount
    );

    console.log(bondingCurve.target)



    const router = new ethers.Contract("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", routerABI, owner)

    return { bondingCurve, owner, feeReciver, router, otherAccount };
  }


  describe("Deployment", function () {
    it("buy and sell", async function () {
      const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      const linkAddr = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
      const { bondingCurve, owner, router, feeReciver, otherAccount } = await loadFixture(deployOneYearLockFixture);


      console.log("Feee reciver balance before creating the token : ", await getBalance(feeReciver.address))

      // create token
      let tx = bondingCurve.createAndInitPurchase("visahl", "vis", {
        value: ethers.parseEther("1")  // 0.1 ETH as the value
      });


      await expect(tx)
        .to.emit(bondingCurve, "TokenPurchased")

      console.log("Feee reciver balance after creating the token(set 1 eth) : ", await getBalance(feeReciver.address))


      // get token address
      const tokenAddr = await bondingCurve.tokenAddress(1)

      // see tokens
      // console.log("selling tokens....")
      const token = new ethers.Contract(tokenAddr, tokenAbi, owner)

      // tx = await token.approve(bondingCurve.target, "100000000000000000000");
      // await tx.wait()

      // const _ethAmont = await bondingCurve.getEthAmountBySale(tokenAddr, "10000000000000");
      // tx = await bondingCurve.sellToken(tokenAddr, "10000000000000", _ethAmont);
      // await tx.wait()
      // console.log("completed...")

      // console.log(`Feee reciver balance after selling the token (sent) ${ethers.formatEther(_ethAmont)} : ${await getBalance(feeReciver.address)}`)



      // send some extra eth
      console.log("bying tokens...")
      const tTotal = (await bondingCurve.virtualPools(tokenAddr))[1]
      let ethAmount = await bondingCurve.getEthAmountToBuyTokens(tokenAddr, tTotal.toString());
      // const tokensWillRecive = await bondingCurve.getTokenAmountByPurchase(tokenAddr, ethAmount);

      // const c = (Number(tTotal) - Number(tokensWillRecive)) / Number(tokensWillRecive)

      // console.log("diffence : ", c)


      // console.log("tokenswill recive : ", tokensWillRecive.toString()) 
      // console.log("totaol token :", tTotal)

      ethAmount = BigInt(ethAmount) + BigInt(ethers.parseEther('0.001')) // sseidnig extra to active pool
      tx = await bondingCurve.purchaseToken(tokenAddr, tTotal, {
        value: ethAmount
      });
      await tx.wait()
      console.log("comleted")

      console.log(`Feee reciver balance after purchasing the token (sent) ${ethers.formatEther(ethAmount)} : ${await getBalance(feeReciver.address)}`)

      ////////// //////////////////////////////////////////////////////////
      // // estimate amount

      console.log("bying tokens from... :", otherAccount.address)
      ethAmount = ethers.parseUnits("0.1", "ether"); // 0.1 ETH
      const estimatedTokenAmount = await router.getAmountsOut(ethAmount, [weth, tokenAddr]);
      console.log("Estimated Token Amount: ", estimatedTokenAmount[1].toString());

      await router.connect(otherAccount).swapExactETHForTokensSupportingFeeOnTransferTokens(
        estimatedTokenAmount[1], // Minimum amount of tokens to receive
        [weth, tokenAddr],          // Swap path
        otherAccount.address,           // Recipient address
        Math.floor(Date.now() / 1000) + 60 * 20, // Deadline (20 minutes)
        { value: ethAmount }        // ETH to send
      );

      console.log("puchacing token on uniswap completed!");

      // console.log("Selling tokens.... from : ", otherAccount.address)
      // tx = await token.connect(otherAccount).approve(router, ethers.parseEther("10000"))
      // await tx.wait()

      // await router.connect(otherAccount).swapExactTokensForETHSupportingFeeOnTransferTokens(
      //   "100000000",
      //   0, // Minimum amount of tokens to receive
      //   [tokenAddr, weth],          // Swap path
      //   otherAccount.address,           // Recipient address
      //   Math.floor(Date.now() / 1000) + 60 * 20, // Deadline (20 minutes)
      // );
      // console.log("completed!");

      // imporsnate link address to send to the contract 
      const impersonatedAddress = "0xC06f25517E906b7F9B4deC3C7889503Bb00b3370"; // get it from -> https://etherscan.io/token/0x514910771AF9Ca656af840dff83E8264EcF986CA#balances

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [impersonatedAddress],
      });
      console.log(`Impersonating account: ${impersonatedAddress}`);

      const impersonatedSigner = await ethers.getSigner(impersonatedAddress);
      // link token 

      const linkToken = new ethers.Contract(linkAddr, tokenAbi, owner)
      // send link token to token contract
      tx = await linkToken.connect(impersonatedSigner).transfer(tokenAddr, ethers.parseEther("11"))
      await tx.wait()

      // link token balance of token contract

      const linkBlanceOftokenContract = await linkToken.balanceOf(tokenAddr);
      console.log("link balance of token : ", linkBlanceOftokenContract.toString(), tokenAddr)

      // call registerAndPredictID to setup upkeep automatlcy
      const _token = new ethers.Contract(tokenAddr, upkeepTokenAbi, owner)

      const registrationParams = {
        name: "test upkeep", // string
        encryptedEmail: "0x", // bytes
        upkeepContract: token.target, // address of token contract
        gasLimit: 500000, // uint32
        adminAddress: owner.address, // address msg.send addrses
        triggerType: 0, // uint8
        checkData: "0x", // bytes
        triggerConfig: "0x", // bytes
        offchainConfig: "0x", // bytes
        amount: ethers.parseEther("11"), // uint96
      };
      tx = await _token.registerAndPredictID(registrationParams);
      await tx.wait()


      // Increase the time by 2 seconds
      await network.provider.send("evm_increaseTime", [2]);
      await network.provider.send("evm_mine");

      // static call to check up
      tx = await linkToken.connect(impersonatedSigner).transfer(tokenAddr, ethers.parseEther("11"))
      await tx.wait()

      tx = await _token.performUpkeep("0x");
      await tx.wait()

      




    });



  });


});
