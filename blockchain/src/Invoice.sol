// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Invoice - Simple invoice payment with native ETH
/// @notice No approval needed, user just sends ETH directly
contract Invoice {
    enum InvoiceStatus {
        Pending,
        Paid,
        Cancelled
    }

    struct InvoiceData {
        uint256 invoiceId;
        address merchant;
        address payer;
        uint256 amount; // dalam wei (18 decimals)
        uint256 fee; // platform fee dalam wei
        uint256 createdAt;
        uint256 paidAt;
        InvoiceStatus status;
        string metadata;
    }

    error InvoiceNotFound();
    error InvoiceAlreadyPaid();
    error InvoiceAlreadyCancelled();
    error OnlyMerchantCanCancel();
    error AmountZero();
    error InvalidMerchant();
    error InsufficientPayment();
    error TransferFailed();

    address public owner;
    uint256 private _nextInvoiceId = 1;
    mapping(uint256 => InvoiceData) private _invoices;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed merchant,
        uint256 amount,
        uint256 fee
    );
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount
    );
    event InvoiceCancelled(uint256 indexed invoiceId);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Membuat invoice baru
    /// @param merchant Alamat penerima pembayaran
    /// @param amount Jumlah dalam wei (18 decimals)
    /// @param fee Platform fee dalam wei
    /// @param metadata JSON string untuk data tambahan
    function createInvoice(
        address merchant,
        uint256 amount,
        uint256 fee,
        string calldata metadata
    ) external returns (uint256 invoiceId) {
        if (merchant == address(0)) revert InvalidMerchant();
        if (amount == 0) revert AmountZero();

        invoiceId = _nextInvoiceId++;

        _invoices[invoiceId] = InvoiceData({
            invoiceId: invoiceId,
            merchant: merchant,
            payer: address(0),
            amount: amount,
            fee: fee,
            createdAt: block.timestamp,
            paidAt: 0,
            status: InvoiceStatus.Pending,
            metadata: metadata
        });

        emit InvoiceCreated(invoiceId, merchant, amount, fee);
        return invoiceId;
    }

    /// @notice Mendapatkan data invoice
    function getInvoice(
        uint256 invoiceId
    ) external view returns (InvoiceData memory) {
        InvoiceData memory inv = _invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        return inv;
    }

    /// @notice Membayar invoice dengan ETH (tanpa approval!)
    /// @param invoiceId ID invoice yang akan dibayar
    function payInvoice(uint256 invoiceId) external payable {
        InvoiceData storage inv = _invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        if (inv.status == InvoiceStatus.Paid) revert InvoiceAlreadyPaid();
        if (inv.status == InvoiceStatus.Cancelled)
            revert InvoiceAlreadyCancelled();

        uint256 totalAmount = inv.amount + inv.fee;
        if (msg.value < totalAmount) revert InsufficientPayment();

        // Transfer ETH ke merchant
        (bool successMerchant, ) = payable(inv.merchant).call{
            value: inv.amount
        }("");
        if (!successMerchant) revert TransferFailed();

        // Transfer fee ke owner
        if (inv.fee > 0) {
            (bool successFee, ) = payable(owner).call{value: inv.fee}("");
            if (!successFee) revert TransferFailed();
        }

        // Refund kelebihan ETH
        uint256 excess = msg.value - totalAmount;
        if (excess > 0) {
            (bool successRefund, ) = payable(msg.sender).call{value: excess}(
                ""
            );
            if (!successRefund) revert TransferFailed();
        }

        inv.payer = msg.sender;
        inv.paidAt = block.timestamp;
        inv.status = InvoiceStatus.Paid;

        emit InvoicePaid(invoiceId, msg.sender, totalAmount);
    }

    /// @notice Membatalkan invoice (hanya merchant)
    function cancelInvoice(uint256 invoiceId) external {
        InvoiceData storage inv = _invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        if (inv.status == InvoiceStatus.Paid) revert InvoiceAlreadyPaid();
        if (inv.status == InvoiceStatus.Cancelled)
            revert InvoiceAlreadyCancelled();
        if (msg.sender != inv.merchant) revert OnlyMerchantCanCancel();

        inv.status = InvoiceStatus.Cancelled;

        emit InvoiceCancelled(invoiceId);
    }

    /// @notice Mendapatkan jumlah total invoice yang dibuat
    function totalInvoices() external view returns (uint256) {
        return _nextInvoiceId - 1;
    }
}
