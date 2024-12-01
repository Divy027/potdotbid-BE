// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {VRFV2PlusWrapperConsumerBase} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "hardhat/console.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

contract Token is
    ERC20,
    VRFV2PlusWrapperConsumerBase,
    AutomationCompatibleInterface
{
    address private bondingCurveContract;
    bool private isLaunchedOnDex;

    // address wrapperAddress = 0x02aae1A04f9828517b3007f83f6181900CaD910c; // change it sepolia : 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    // Selection Parameters
    uint256 public constant DAILY_SELECTION_INTERVAL = 1 days;
    uint256 public lastSelectionTime;
    address[] public selectedAddresses;

    // Holder Management
    address[] private holders;
    address[] private eligibleAddressList;
    mapping(address => bool) private holderExists;
    uint256 private constant MINIMUM_BALANCE_THRESHOLD = 1 * 10 ** 18; // Minimum 1 token to be eligible

    /* Errors */
    error UpkeepNotNeeded();

    // Events
    event AddressesSelectedDaily(
        address[] indexed selectedAddresses,
        uint256 timestamp
    );
    event HolderAdded(address indexed holder);
    event SellAttempted(address indexed seller, uint256 amount);

    modifier onlyBondingCurveContract() {
        require(msg.sender == bondingCurveContract, "Caller is not the owner");
        _; // This is a placeholder that represents the execution of the function
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _owner
    )
        ERC20(_name, _symbol)
        VRFV2PlusWrapperConsumerBase(0x02aae1A04f9828517b3007f83f6181900CaD910c) // wrapperAddress etherum
    {
        bondingCurveContract = _owner;
        _mint(_owner, _initialSupply);
    }

    // Override transfer method with additional checks
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Before DEX launch, allow normal transfers
        if (!isLaunchedOnDex) {
            super._update(from, to, amount);
        } else {
            address _pair = IUniswapV2Factory(
                0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f // factory
            ).getPair(
                    0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // weth
                    address(this)
                );

            // if sell
            if (to == _pair) {
                bool selectedAddr = false;
                // Only selected address can sell
                for (uint i = 0; i < selectedAddresses.length; i++) {
                    if (from == selectedAddresses[i]) {
                        selectedAddr = true;
                        break;
                    }
                }

                require(selectedAddr, "Only selected address can sell");

                // Emit sell attempt event
                emit SellAttempted(from, amount);
            }

            // Perform regular transfer if not selling
            super._update(from, to, amount);
        }

        // Add new holders when receiving tokens
        if (to != address(0) && balanceOf(to) > 0) {
            addHolder(to);
        }
    }

    // Internal function to add holders
    function addHolder(address _holder) internal {
        if (!holderExists[_holder] && _holder != address(0)) {
            holders.push(_holder);
            holderExists[_holder] = true;
            emit HolderAdded(_holder);
        }
    }

    function burn(uint256 _amount) public {
        _burn(msg.sender, _amount);
    }

    function setLaunchedOnDex(bool _isLauched) public onlyBondingCurveContract {
        isLaunchedOnDex = _isLauched;
    }

    // Check if upkeep is needed
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        upkeepNeeded = (block.timestamp >=
            lastSelectionTime + DAILY_SELECTION_INTERVAL);
    }

    // Perform the upkeep
    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert UpkeepNotNeeded();
        }

        // Clear previous eligible addresses
        delete eligibleAddressList;

        // eligible addresses
        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];
            if (balanceOf(holder) >= MINIMUM_BALANCE_THRESHOLD) {
                eligibleAddressList.push(holder);
            }
        }

        // Ensure at least one eligible address exists
        require(eligibleAddressList.length > 0, "No eligible addresses");

        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(
            VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
        );

        uint32 arrayLength = uint32(eligibleAddressList.length);
        uint32 numberOfRandomNumbers = uint32(
            (block.timestamp % (arrayLength / 2)) + 1
        );

        uint256 requestId;
        uint256 reqPrice;
        (requestId, reqPrice) = requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            numberOfRandomNumbers, // number of random numberes
            extraArgs
        );

        lastSelectionTime = block.timestamp;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(eligibleAddressList.length > 0, "No eligible addresses");
        require(
            _randomWords.length <= eligibleAddressList.length,
            "Too many winners requested"
        );

        bool[] memory usedIndices = new bool[](eligibleAddressList.length);

        address[] memory winners = new address[](_randomWords.length);

        for (uint256 i = 0; i < _randomWords.length; i++) {
            uint256 randomIndex = _randomWords[i] % eligibleAddressList.length;

            // Find next available unique index
            for (uint256 j = 0; j < eligibleAddressList.length; j++) {
                uint256 checkIndex = randomIndex % eligibleAddressList.length;

                if (!usedIndices[checkIndex]) {
                    usedIndices[checkIndex] = true;
                    winners[i] = eligibleAddressList[checkIndex];
                    break;
                }
            }
        }

        selectedAddresses = winners;
        emit AddressesSelectedDaily(selectedAddresses, block.timestamp);
    }

    // getters
    function getHolders() external view returns (address[] memory) {
        return holders;
    }

    function getEligibleAddresses() external view returns (address[] memory) { // holders eligibile for selection
        return eligibleAddressList;
    }

    function getCurrentSelectedAddresses() // winner address after selection
        external
        view
        returns (address[] memory)
    {
        return selectedAddresses;
    }
}
