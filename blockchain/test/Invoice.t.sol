// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MockUSDC.sol";
import "../src/MockIDRX.sol";
import "../src/DeQRyptRouter.sol";
import "../src/Invoice.sol";

contract InvoiceTest is Test {
    MockUSDC usdc;
    MockIDRX idrx;
    DeQRyptRouter router;
    Invoice invoice;

    address merchant;
    address payer;
    address treasury;

    function setUp() external {
        merchant = makeAddr("merchant");
        payer = makeAddr("payer");
        treasury = makeAddr("treasury");

        usdc = new MockUSDC();
        idrx = new MockIDRX();
        router = new DeQRyptRouter(address(idrx), treasury);
        invoice = new Invoice(address(idrx), address(router));

        // Config router
        router.setAllowedToken(address(usdc), true);
        router.setRate(address(usdc), 15_000e6); // 1 USDC => 15,000 IDRX

        // Fund payer
        usdc.mint(payer, 1_000_000e6);
        idrx.mint(payer, 1_000_000e6);
    }

    function testCreateInvoice() external {
        uint256 invoiceId = invoice.createInvoice(
            merchant,
            15_000e6, // 15,000 IDRX
            100e6, // 100 IDRX fee
            '{"tokenSymbol":"IDRX","fiatSymbol":"IDR","fiatAmount":"15000"}'
        );

        assertEq(invoiceId, 1);

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        assertEq(inv.merchant, merchant);
        assertEq(inv.amount, 15_000e6);
        assertEq(inv.fee, 100e6);
        assertEq(uint256(inv.status), uint256(Invoice.InvoiceStatus.Pending));

        console.log("Invoice ID:", invoiceId);
        console.log("Merchant:", inv.merchant);
        console.log("Amount:", inv.amount);
        console.log("Fee:", inv.fee);
        console.log("Status:", uint256(inv.status));
    }

    function testGetInvoiceData() external {
        // Create invoice
        uint256 invoiceId = invoice.createInvoice(
            merchant,
            15_000e6,
            100e6,
            '{"tokenSymbol":"USDC","fiatSymbol":"IDR","fiatAmount":"237000"}'
        );

        // Get invoice data
        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);

        // Log semua data yang didapat dari blockchain
        console.log("=== INVOICE DATA FROM BLOCKCHAIN ===");
        console.log("invoiceId:", inv.invoiceId);
        console.log("merchant:", inv.merchant);
        console.log("payer:", inv.payer);
        console.log("amount:", inv.amount);
        console.log("fee:", inv.fee);
        console.log("createdAt:", inv.createdAt);
        console.log("paidAt:", inv.paidAt);
        console.log("status:", uint256(inv.status)); // 0=Pending, 1=Paid, 2=Cancelled
        console.log("metadata:", inv.metadata);
        console.log("====================================");

        // Pay invoice lalu cek data lagi
        vm.startPrank(payer);
        idrx.approve(address(invoice), 15_100e6);
        invoice.payInvoice(invoiceId);
        vm.stopPrank();

        Invoice.InvoiceData memory paidInv = invoice.getInvoice(invoiceId);
        console.log("");
        console.log("=== AFTER PAYMENT ===");
        console.log("payer:", paidInv.payer);
        console.log("paidAt:", paidInv.paidAt);
        console.log("status:", uint256(paidInv.status)); // should be 1 (Paid)
        console.log("=====================");
    }

    function testPayInvoice() external {
        // Create invoice
        uint256 invoiceId = invoice.createInvoice(
            merchant,
            15_000e6,
            100e6,
            '{"tokenSymbol":"IDRX"}'
        );

        vm.startPrank(payer);

        uint256 totalAmount = 15_000e6 + 100e6;
        idrx.approve(address(invoice), totalAmount);
        invoice.payInvoice(invoiceId);

        vm.stopPrank();

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        assertEq(uint256(inv.status), uint256(Invoice.InvoiceStatus.Paid));
        assertEq(inv.payer, payer);
        assertEq(idrx.balanceOf(merchant), 15_000e6);
        assertEq(idrx.balanceOf(address(this)), 100e6); // fee to owner (test contract)

        console.log("Invoice ID:", invoiceId);
        console.log("Merchant:", inv.merchant);
        console.log("Payer:", inv.payer);
        console.log("Amount:", inv.amount);
        console.log("Fee:", inv.fee);
        console.log("Status:", uint256(inv.status));
    }

    function testPayInvoiceViaRouter() external {
        // Create invoice
        uint256 invoiceId = invoice.createInvoice(
            merchant,
            15_000e6,
            0, // no fee for router payment in MVP
            '{"tokenSymbol":"USDC"}'
        );

        vm.startPrank(payer);

        uint256 amountInUSDC = 1e6; // 1 USDC
        usdc.approve(address(invoice), amountInUSDC);

        uint256 deadline = block.timestamp + 1 hours;
        invoice.payInvoiceViaRouter(
            invoiceId,
            address(usdc),
            amountInUSDC,
            15_000e6, // minOut
            deadline
        );

        vm.stopPrank();

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        assertEq(uint256(inv.status), uint256(Invoice.InvoiceStatus.Paid));
        assertEq(inv.payer, payer);
        assertEq(idrx.balanceOf(merchant), 15_000e6);

        console.log("Invoice ID:", invoiceId);
        console.log("Merchant:", inv.merchant);
        console.log("Payer:", inv.payer);
        console.log("Amount:", inv.amount);
        console.log("Fee:", inv.fee);
        console.log("Status:", uint256(inv.status));
    }

    function testCancelInvoice() external {
        uint256 invoiceId = invoice.createInvoice(
            merchant,
            15_000e6,
            100e6,
            "{}"
        );

        vm.prank(merchant);
        invoice.cancelInvoice(invoiceId);

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        assertEq(uint256(inv.status), uint256(Invoice.InvoiceStatus.Cancelled));

        console.log("Invoice ID:", invoiceId);
        console.log("Merchant:", inv.merchant);
        console.log("Payer:", inv.payer);
        console.log("Amount:", inv.amount);
        console.log("Fee:", inv.fee);
        console.log("Status:", uint256(inv.status));
    }

    function testCannotPayPaidInvoice() external {
        uint256 invoiceId = invoice.createInvoice(merchant, 15_000e6, 0, "{}");

        vm.startPrank(payer);
        idrx.approve(address(invoice), 15_000e6);
        invoice.payInvoice(invoiceId);

        // Try to pay again
        vm.expectRevert(Invoice.InvoiceAlreadyPaid.selector);
        invoice.payInvoice(invoiceId);
        vm.stopPrank();

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        console.log("Invoice ID:", invoiceId);
        console.log("Merchant:", inv.merchant);
        console.log("Payer:", inv.payer);
        console.log("Amount:", inv.amount);
        console.log("Fee:", inv.fee);
        console.log("Status:", uint256(inv.status));
    }

    function testOnlyMerchantCanCancel() external {
        uint256 invoiceId = invoice.createInvoice(merchant, 15_000e6, 0, "{}");

        vm.prank(payer);
        vm.expectRevert(Invoice.OnlyMerchantCanCancel.selector);
        invoice.cancelInvoice(invoiceId);

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        console.log("Invoice ID:", invoiceId);
        console.log("Merchant:", inv.merchant);
        console.log("Payer:", inv.payer);
        console.log("Amount:", inv.amount);
        console.log("Fee:", inv.fee);
        console.log("Status:", uint256(inv.status));
    }
}
