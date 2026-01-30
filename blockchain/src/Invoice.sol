// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Invoice {
    enum InvoiceStatus { Pending, Paid, Cancelled }

    struct InvoiceData {
        uint256 invoiceId;
        address merchant;
        address tokenIn;   // Alamat Token (Bisa USDC atau IDRX)
        uint256 amountIn;  // Nominal yang harus dibayar
        InvoiceStatus status;
        string metadata;
    }

    // Event sangat penting agar Frontend (polling) bisa mendeteksi perubahan
    event InvoiceCreated(uint256 indexed invoiceId, address indexed merchant, address tokenIn, uint256 amountIn);
    event InvoicePaid(uint256 indexed invoiceId, address indexed payer);
    event InvoiceCancelled(uint256 indexed invoiceId);

    uint256 private _nextInvoiceId = 1;
    mapping(uint256 => InvoiceData) private _invoices;

    /**
     * @dev Merchant membuat invoice. 
     * tokenIn: masukkan alamat USDC jika ingin dibayar USDC, atau IDRX jika ingin IDRX.
     */
    function createInvoice(
        address merchant,
        address tokenIn,
        uint256 amountIn,
        string calldata metadata
    ) external returns (uint256 invoiceId) {
        invoiceId = _nextInvoiceId++;
        _invoices[invoiceId] = InvoiceData({
            invoiceId: invoiceId,
            merchant: merchant,
            tokenIn: tokenIn,
            amountIn: amountIn,
            status: InvoiceStatus.Pending,
            metadata: metadata
        });

        emit InvoiceCreated(invoiceId, merchant, tokenIn, amountIn);
        return invoiceId;
    }

    /**
     * @dev Payer membayar invoice ID tertentu.
     * Tidak butuh parameter nominal lagi karena sudah tersimpan di data invoice.
     */
    function payInvoice(uint256 invoiceId) external {
        InvoiceData storage inv = _invoices[invoiceId];
        require(inv.status == InvoiceStatus.Pending, "Invoice not pending");
        require(inv.merchant != address(0), "Invoice does not exist");

        // Eksekusi transfer langsung dari Payer ke Merchant
        bool success = IERC20(inv.tokenIn).transferFrom(msg.sender, inv.merchant, inv.amountIn);
        require(success, "Transfer failed");

        inv.status = InvoiceStatus.Paid;

        emit InvoicePaid(invoiceId, msg.sender);
    }

    function cancelInvoice(uint256 invoiceId) external {
        InvoiceData storage inv = _invoices[invoiceId];
        require(msg.sender == inv.merchant, "Only merchant can cancel");
        require(inv.status == InvoiceStatus.Pending, "Invoice not pending");

        inv.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId);
    }

    function getInvoice(uint256 invoiceId) external view returns (InvoiceData memory) {
        return _invoices[invoiceId];
    }
}