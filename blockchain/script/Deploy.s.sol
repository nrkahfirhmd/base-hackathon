// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import "../src/MockUSDC.sol";
import "../src/MockIDRX.sol";
import "../src/DeQRyptRouter.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        MockUSDC usdc = new MockUSDC();
        MockIDRX idrx = new MockIDRX();

        // treasury = deployer (wallet gw dapit)
        DeQRyptRouter router = new DeQRyptRouter(address(idrx), deployer);

        // config V2
        router.setAllowedToken(address(usdc), true);
        router.setRate(address(usdc), 15_000e6); // 1 USDC => 15,000 IDRX

        // demo funds
        usdc.mint(deployer, 1_000_000e6);
        idrx.mint(deployer, 1_000_000e6);

        vm.stopBroadcast();

        console2.log("Deployer:", deployer);
        console2.log("MockUSDC:", address(usdc));
        console2.log("MockIDRX:", address(idrx));
        console2.log("Router(V2):", address(router));
        console2.log("Treasury:", deployer);
    }
}
