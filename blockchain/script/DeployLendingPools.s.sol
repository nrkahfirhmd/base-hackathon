// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";

import "../src/MockLendingPool.sol";

contract DeployLendingPools is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        // Token addresses from existing deployment
        // Update these with your actual deployed token addresses
        address mUSDC = vm.envAddress("MOCK_USDC_ADDRESS");
        address mIDRX = vm.envAddress("MOCK_IDRX_ADDRESS");

        console2.log("Deployer:", deployer);
        console2.log("mUSDC Token:", mUSDC);
        console2.log("mIDRX Token:", mIDRX);

        vm.startBroadcast(pk);

        // Deploy Lending Pool for mUSDC
        // APR: 500 = 5%, Decimals: 6 (same as mUSDC)
        MockLendingPool poolUSDC = new MockLendingPool(
            mUSDC,
            500, // 5% APR
            "LP mUSDC Pool",
            "lpUSDC",
            6
        );

        // Deploy Lending Pool for mIDRX
        // APR: 800 = 8%, Decimals: 6 (same as mIDRX)
        MockLendingPool poolIDRX = new MockLendingPool(
            mIDRX,
            800, // 8% APR
            "LP mIDRX Pool",
            "lpIDRX",
            6
        );

        vm.stopBroadcast();

        console2.log("");
        console2.log("=== DEPLOYMENT COMPLETE ===");
        console2.log("LendingPool mUSDC:", address(poolUSDC));
        console2.log("LendingPool mIDRX:", address(poolIDRX));
        console2.log("");
        console2.log("=== ADD TO YOUR .env FILES ===");
        console2.log("Backend .env:");
        console2.log("LENDING_POOL_ADDRESS_MUSDC=", address(poolUSDC));
        console2.log("LENDING_POOL_ADDRESS_MIDRX=", address(poolIDRX));
        console2.log("");
        console2.log("Frontend .env.local:");
        console2.log("NEXT_PUBLIC_LENDING_POOL_MUSDC=", address(poolUSDC));
        console2.log("NEXT_PUBLIC_LENDING_POOL_MIDRX=", address(poolIDRX));
    }
}
