// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockIDRX is ERC20 {
    uint8 private constant _DECIMALS = 6;

    constructor() ERC20("Mock IDRX", "mIDRX") {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    // sengaja dibuat bebas untuk testnet/hackathon
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
