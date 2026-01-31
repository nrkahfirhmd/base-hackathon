// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/Invoice.sol";

contract DeployInvoice is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console2.log("Deployer:", deployer);

        vm.startBroadcast(pk);
        Invoice invoice = new Invoice();
        vm.stopBroadcast();

        console2.log("Invoice deployed at:", address(invoice));
    }
}
