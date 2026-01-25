// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockUSDC.sol";
import "../src/MockIDRX.sol";
import "../src/DeQRyptRouter.sol";

contract DeQRyptRouterTest is Test {
    MockUSDC usdc;
    MockIDRX idrx;
    DeQRyptRouter router;

    address payer;
    address merchant;
    address treasury;

    function setUp() external {
        payer = makeAddr("payer");
        merchant = makeAddr("merchant");
        treasury = makeAddr("treasury");
        usdc = new MockUSDC();
        idrx = new MockIDRX();

        router = new DeQRyptRouter(address(idrx), treasury);

        // fund payer
        usdc.mint(payer, 1_000_000e6);
        idrx.mint(payer, 1_000_000e6);
    }

    function testPay_IDRX_Direct() external {
        vm.startPrank(payer);

        uint256 amount = 15_000e6;
        idrx.approve(address(router), amount);

        bytes32 ref = bytes32("INV-0001");
        uint256 deadline = block.timestamp + 1 hours;

        router.pay(address(idrx), amount, amount, merchant, ref, deadline);

        vm.stopPrank();

        assertEq(idrx.balanceOf(merchant), amount);
    }

    function testPay_USDC_SimulatedSwap_ToTreasury_AndMintIDRX() external {
        // owner config
        router.setAllowedToken(address(usdc), true);

        // 1 USDC -> 15,000 IDRX
        router.setRate(address(usdc), 15_000e6);

        vm.startPrank(payer);

        uint256 amountInUSDC = 1e6; // 1 USDC
        usdc.approve(address(router), amountInUSDC);

        bytes32 ref = bytes32("INV-0002");
        uint256 deadline = block.timestamp + 1 hours;

        uint256 minOut = 15_000e6; // expect 15,000 IDRX
        uint256 out = router.pay(address(usdc), amountInUSDC, minOut, merchant, ref, deadline);

        vm.stopPrank();

        assertEq(out, 15_000e6);
        assertEq(usdc.balanceOf(treasury), amountInUSDC);
        assertEq(idrx.balanceOf(merchant), 15_000e6);
    }

    function testPay_USDC_RevertIfNotAllowed() external {
        vm.startPrank(payer);

        uint256 amount = 1e6;
        usdc.approve(address(router), amount);

        bytes32 ref = bytes32("INV-0003");
        uint256 deadline = block.timestamp + 1 hours;

        vm.expectRevert(DeQRyptRouter.TokenNotAllowed.selector);
        router.pay(address(usdc), amount, 0, merchant, ref, deadline);

        vm.stopPrank();
    }
}
