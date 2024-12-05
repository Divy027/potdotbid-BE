// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {VRFV2PlusWrapperConsumerBase} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "hardhat/console.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

struct RegistrationParams {
    string name;
    bytes encryptedEmail;
    address upkeepContract;
    uint32 gasLimit;
    address adminAddress;
    uint8 triggerType;
    bytes checkData;
    bytes triggerConfig;
    bytes offchainConfig;
    uint96 amount;
}

/**
 * string name = "test upkeep";
 * bytes encryptedEmail = 0x;
 * address upkeepContract = 0x...;
 * uint32 gasLimit = 500000;
 * address adminAddress = 0x....;
 * uint8 triggerType = 0;
 * bytes checkData = 0x;
 * bytes triggerConfig = 0x;
 * bytes offchainConfig = 0x;
 * uint96 amount = 1000000000000000000;
 */

interface AutomationRegistrarInterface {
    function registerUpkeep(
        RegistrationParams calldata requestParams
    ) external returns (uint256);
}

contract Token is
    ERC20,
    VRFV2PlusWrapperConsumerBase,
    ConfirmedOwner,
    AutomationCompatibleInterface
{
    LinkTokenInterface public immutable i_link =
        LinkTokenInterface(0x514910771AF9Ca656af840dff83E8264EcF986CA);
    AutomationRegistrarInterface public immutable i_registrar =
        AutomationRegistrarInterface(
            0x6B0B234fB2f380309D47A7E9391E29E9a179395a
        );

    address private bondingCurveContract;
    bool private isLaunchedOnDex;

    // address wrapperAddress = 0x02aae1A04f9828517b3007f83f6181900CaD910c; // change it sepolia : 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1
    uint32 public callbackGasLimit = 300000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    // Selection Parameters
    uint256 public constant DAILY_SELECTION_INTERVAL = 86400 seconds; // 1 days
    uint256 public lastSelectionTime;
    address[] public selectedAddresses;

    // Holder Management
    address[] private holders;
    address[] private eligibleAddressList;
    mapping(address => bool) private holderExists;
    uint256 private constant MINIMUM_BALANCE_THRESHOLD = 1 * 10 ** 18; // Minimum 1 token to be eligible

    // New mapping to store sell percentages for winners
    mapping(address => uint256) public sellPercentages;

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
        ConfirmedOwner(msg.sender)
        VRFV2PlusWrapperConsumerBase(0x02aae1A04f9828517b3007f83f6181900CaD910c) // wrapperAddress etherum
    {
        bondingCurveContract = _owner;
        _mint(_owner, _initialSupply);
    }

    function registerAndPredictID(RegistrationParams memory params) public {
        // LINK must be approved for transfer - this can be done every time or once
        // with an infinite approval
        i_link.approve(address(i_registrar), params.amount);
        uint256 upkeepID = i_registrar.registerUpkeep(params);
        if (upkeepID != 0) {
            // DEV - Use the upkeepID however you see fit
            console.log("upkeepID value : ", upkeepID);
        } else {
            revert("auto-approve disabled");
        }
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
                uint256 sellPercentage = 0;

                // Only selected address can sell
                for (uint i = 0; i < selectedAddresses.length; i++) {
                    if (from == selectedAddresses[i]) {
                        selectedAddr = true;
                        sellPercentage = sellPercentages[from];
                        break;
                    }
                }

                require(selectedAddr, "Only selected address can sell");

                // Calculate the maximum amount the user can sell
                uint256 maxSellAmount = (balanceOf(from) * sellPercentage) /
                    100;
                require(amount <= maxSellAmount, "Exceeds allowed sell amount");

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
        console.log("hi");
        upkeepNeeded = (isLaunchedOnDex && block.timestamp >=
            lastSelectionTime + DAILY_SELECTION_INTERVAL);
    }

    // Perform the upkeep
    function performUpkeep(bytes calldata /* performData */) external override {
        uint b = IERC20(0x514910771AF9Ca656af840dff83E8264EcF986CA).balanceOf(
            address(this)
        );
        console.log("before : ", b);
        (bool upkeepNeeded, ) = checkUpkeep("");

        if (!upkeepNeeded) {
            revert UpkeepNotNeeded();
        }

        console.log("perform upkeep ------------------------------------->");
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

        console.log("random words : ", numberOfRandomNumbers);

        uint256 requestId;
        uint256 reqPrice;
        (requestId, reqPrice) = requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            numberOfRandomNumbers, // number of random numberes
            extraArgs
        );

        console.log("HI", requestId);

        b = IERC20(0x514910771AF9Ca656af840dff83E8264EcF986CA).balanceOf(
            address(this)
        );
        console.log("after : ", b);

        lastSelectionTime = block.timestamp;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal virtual override {
        console.log("hiiiiiiiiiii");
        require(eligibleAddressList.length > 0, "No eligible addresses");
        require(
            _randomWords.length <= eligibleAddressList.length,
            "Too many winners requested"
        );

        bool[] memory usedIndices = new bool[](eligibleAddressList.length);

        address[] memory winners = new address[](_randomWords.length);

        for (uint256 i = 0; i < _randomWords.length; i++) {
            console.log("winnnnnnnnnnnnnnnnnnnn...............");
            uint256 randomIndex = _randomWords[i] % eligibleAddressList.length;

            // Find next available unique index
            for (uint256 j = 0; j < eligibleAddressList.length; j++) {
                uint256 checkIndex = randomIndex % eligibleAddressList.length;
                uint256 sellPercentage = randomIndex % 100;

                if (!usedIndices[checkIndex]) {
                    usedIndices[checkIndex] = true;
                    winners[i] = eligibleAddressList[checkIndex];
                    sellPercentages[winners[i]] = sellPercentage;
                    break;
                }
            }
        }

        selectedAddresses = winners;
        console.log("winner : ", selectedAddresses[0]);

        emit AddressesSelectedDaily(selectedAddresses, block.timestamp);
    }

    // getters
    function getHolders() external view returns (address[] memory) {
        return holders;
    }

    function getEligibleAddresses() external view returns (address[] memory) {
        return eligibleAddressList;
    }

    function getCurrentSelectedAddresses()
        external
        view
        returns (address[] memory)
    {
        return selectedAddresses;
    }

    function getSellPercentage(address winner) external view returns (uint256) {
        return sellPercentages[winner];
    }
}
