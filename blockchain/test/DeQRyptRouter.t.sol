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

    address payer = address(0xA11CE);
    address merchant = address(0xB0B);

    function setUp() public {
        usdc = new MockUSDC();
        idrx = new MockIDRX();
        router = new DeQRyptRouter(address(idrx));

        // kasih saldo test
        idrx.mint(payer, 1_000_000e6);
        usdc.mint(payer, 1_000_000e6);
    }

    function testHappyPath_IDRXPay_Success() public {
        vm.startPrank(payer);

        uint256 amount = 100e6;
        idrx.approve(address(router), amount);

        bytes32 ref = keccak256("INV-001");
        uint256 deadline = block.timestamp + 1 hours;

        router.pay(address(idrx), amount, 0, merchant, ref, deadline);

        vm.stopPrank();

        assertEq(idrx.balanceOf(merchant), amount);
    }

    function testRevert_NoAllowance() public {
        vm.startPrank(payer);

        uint256 amount = 100e6;
        bytes32 ref = keccak256("INV-002");
        uint256 deadline = block.timestamp + 1 hours;

        // tanpa approve
        vm.expectRevert(); // ERC20: insufficient allowance (bisa beda message)
        router.pay(address(idrx), amount, 0, merchant, ref, deadline);

        vm.stopPrank();
    }

    function testRevert_SwapNotEnabled_WhenTokenInNotIDRX() public {
        vm.startPrank(payer);

        uint256 amount = 100e6;
        usdc.approve(address(router), amount);

        bytes32 ref = keccak256("INV-003");
        uint256 deadline = block.timestamp + 1 hours;

        vm.expectRevert(DeQRyptRouter.SwapNotEnabled.selector);
        router.pay(address(usdc), amount, 0, merchant, ref, deadline);

        vm.stopPrank();
    }
}
