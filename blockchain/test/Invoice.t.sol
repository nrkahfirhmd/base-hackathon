// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Invoice.sol";

contract InvoiceTest is Test {
    Invoice public invoice;

    address public merchant = makeAddr("merchant");
    address public payer = makeAddr("payer");

    // Allow this contract to receive ETH (as owner/fee receiver)
    receive() external payable {}

    function setUp() public {
        invoice = new Invoice();
        // Give payer some ETH
        vm.deal(payer, 100 ether);
    }

    function testCreateInvoice() public {
        uint256 amount = 1 ether;
        uint256 fee = 0.01 ether;
        string memory metadata = '{"description":"Test invoice"}';

        uint256 invoiceId = invoice.createInvoice(
            merchant,
            amount,
            fee,
            metadata
        );

        assertEq(invoiceId, 1);

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        assertEq(inv.merchant, merchant);
        assertEq(inv.amount, amount);
        assertEq(inv.fee, fee);
        assertEq(uint256(inv.status), uint256(Invoice.InvoiceStatus.Pending));

        console.log("Invoice ID:", invoiceId);
        console.log("Merchant:", inv.merchant);
        console.log("Amount:", inv.amount);
        console.log("Fee:", inv.fee);
        console.log("Status:", uint256(inv.status));
    }

    function testPayInvoice() public {
        uint256 amount = 1 ether;
        uint256 fee = 0.01 ether;
        string memory metadata = '{"description":"Test invoice"}';

        uint256 invoiceId = invoice.createInvoice(
            merchant,
            amount,
            fee,
            metadata
        );

        uint256 merchantBalanceBefore = merchant.balance;

        // Payer pays the invoice
        vm.prank(payer);
        invoice.payInvoice{value: amount + fee}(invoiceId);

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        assertEq(inv.payer, payer);
        assertEq(uint256(inv.status), uint256(Invoice.InvoiceStatus.Paid));
        assertEq(merchant.balance, merchantBalanceBefore + amount);

        console.log("Invoice ID:", invoiceId);
        console.log("Payer:", inv.payer);
        console.log("Status:", uint256(inv.status));
        console.log(
            "Merchant received:",
            merchant.balance - merchantBalanceBefore
        );
    }

    function testPayInvoiceWithExcessRefund() public {
        uint256 amount = 1 ether;
        uint256 fee = 0.01 ether;

        uint256 invoiceId = invoice.createInvoice(merchant, amount, fee, "");

        uint256 payerBalanceBefore = payer.balance;

        // Payer sends more ETH than needed
        vm.prank(payer);
        invoice.payInvoice{value: 2 ether}(invoiceId);

        // Check refund
        uint256 spent = payerBalanceBefore - payer.balance;
        assertEq(spent, amount + fee);

        console.log("Amount + Fee:", amount + fee);
        console.log("Payer spent:", spent);
        console.log("Excess refunded correctly!");
    }

    function testCancelInvoice() public {
        uint256 invoiceId = invoice.createInvoice(merchant, 1 ether, 0, "");

        // Only merchant can cancel
        vm.prank(merchant);
        invoice.cancelInvoice(invoiceId);

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);
        assertEq(uint256(inv.status), uint256(Invoice.InvoiceStatus.Cancelled));

        console.log("Invoice cancelled successfully");
    }

    function testOnlyMerchantCanCancel() public {
        uint256 invoiceId = invoice.createInvoice(merchant, 1 ether, 0, "");

        // Payer tries to cancel - should fail
        vm.prank(payer);
        vm.expectRevert(Invoice.OnlyMerchantCanCancel.selector);
        invoice.cancelInvoice(invoiceId);

        console.log("Non-merchant cannot cancel - test passed");
    }

    function testCannotPayPaidInvoice() public {
        uint256 invoiceId = invoice.createInvoice(merchant, 1 ether, 0, "");

        vm.prank(payer);
        invoice.payInvoice{value: 1 ether}(invoiceId);

        // Try to pay again - should fail
        vm.prank(payer);
        vm.expectRevert(Invoice.InvoiceAlreadyPaid.selector);
        invoice.payInvoice{value: 1 ether}(invoiceId);

        console.log("Cannot pay twice - test passed");
    }

    function testInsufficientPayment() public {
        uint256 invoiceId = invoice.createInvoice(
            merchant,
            1 ether,
            0.1 ether,
            ""
        );

        // Try to pay with less ETH
        vm.prank(payer);
        vm.expectRevert(Invoice.InsufficientPayment.selector);
        invoice.payInvoice{value: 0.5 ether}(invoiceId);

        console.log("Insufficient payment rejected - test passed");
    }

    function testGetInvoiceData() public {
        string
            memory metadata = '{"tokenSymbol":"ETH","fiatSymbol":"USD","fiatAmount":"3000"}';

        uint256 invoiceId = invoice.createInvoice(
            merchant,
            1 ether,
            0.01 ether,
            metadata
        );

        Invoice.InvoiceData memory inv = invoice.getInvoice(invoiceId);

        console.log("=== INVOICE DATA FROM BLOCKCHAIN ===");
        console.log("invoiceId:", inv.invoiceId);
        console.log("merchant:", inv.merchant);
        console.log("payer:", inv.payer);
        console.log("amount:", inv.amount);
        console.log("fee:", inv.fee);
        console.log("createdAt:", inv.createdAt);
        console.log("paidAt:", inv.paidAt);
        console.log("status:", uint256(inv.status));
        console.log("metadata:", inv.metadata);
        console.log("====================================");

        // Pay the invoice
        vm.prank(payer);
        invoice.payInvoice{value: 1.01 ether}(invoiceId);

        inv = invoice.getInvoice(invoiceId);
        console.log("");
        console.log("=== AFTER PAYMENT ===");
        console.log("payer:", inv.payer);
        console.log("paidAt:", inv.paidAt);
        console.log("status:", uint256(inv.status));
        console.log("=====================");
    }
}
