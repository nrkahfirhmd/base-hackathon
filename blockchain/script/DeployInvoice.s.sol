// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/Invoice.sol";

contract DeployInvoice is Script {
    address constant IDRX = 0xA62B99a9B85429F5d20dc8E48288f0Cf72aae63B;
    address constant ROUTER = 0x7cEd137A9c12a4B47eb2fE56554c9E7e1FAC31aD;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console2.log("Deployer:", deployer);
        console2.log("IDRX:", IDRX);
        console2.log("Router:", ROUTER);

        vm.startBroadcast(pk);
        Invoice invoice = new Invoice(IDRX, ROUTER);
        vm.stopBroadcast();

        console2.log("Invoice deployed at:", address(invoice));
    }
}
