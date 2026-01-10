// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/MockIDRX.sol";
import "../src/DeQRyptRouter.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast(); // <- private key diambil dari CLI --private-key

        MockUSDC usdc = new MockUSDC();
        MockIDRX idrx = new MockIDRX();
        DeQRyptRouter router = new DeQRyptRouter(address(idrx));

        // mint ke msg.sender (deployer) buat demo
        idrx.mint(msg.sender, 1_000_000e6);
        usdc.mint(msg.sender, 1_000_000e6);

        vm.stopBroadcast();

        console2.log("MockUSDC:", address(usdc));
        console2.log("MockIDRX:", address(idrx));
        console2.log("Router:", address(router));
    }
}
