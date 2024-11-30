// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address private bondingCurveContract;
    bool private isLaunchedOnDex;

    modifier onlyBondingCurveContract() {
        require(msg.sender == bondingCurveContract, "Caller is not the owner");
        _; // This is a placeholder that represents the execution of the function
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _owner
    ) ERC20(_name, _symbol) {
        bondingCurveContract = _owner;
        _mint(_owner, _initialSupply);
    }

    function burn(uint256 _amount) public {
        _burn(msg.sender, _amount);
    }

    function setLaunchedOnDex(bool _isLauched) public onlyBondingCurveContract {
        isLaunchedOnDex = _isLauched;
    }

    
}
