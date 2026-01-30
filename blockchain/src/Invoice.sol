// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IDeQRyptRouter {
    function pay(
        address tokenIn,
        uint256 amountIn,
        uint256 minOutIDRX,
        address recipient,
        bytes32 referenceId,
        uint256 deadline
    ) external returns (uint256 amountOutIDRX);
}

contract Invoice {
    using SafeERC20 for IERC20;

    enum InvoiceStatus { Pending, Paid, Cancelled }

    struct InvoiceData {
        uint256 invoiceId;
        address merchant;      // penerima pembayaran
        address payer;         // pembayar (diisi saat pay)
        uint256 amount;        // jumlah dalam IDRX (6 decimals)
        uint256 fee;           // platform fee dalam IDRX
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

    address public owner;
    IERC20 public immutable idrx;
    IDeQRyptRouter public immutable router;

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

    constructor(address _idrx, address _router) {
        owner = msg.sender;
        idrx = IERC20(_idrx);
        router = IDeQRyptRouter(_router);
    }

    /// @notice Membuat invoice baru
    /// @param merchant Alamat penerima pembayaran
    /// @param amount Jumlah dalam IDRX (6 decimals)
    /// @param fee Platform fee dalam IDRX
    /// @param metadata JSON string untuk data tambahan (tokenSymbol, fiatAmount, dll)
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
    function getInvoice(uint256 invoiceId) external view returns (InvoiceData memory) {
        InvoiceData memory inv = _invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        return inv;
    }

    /// @notice Membayar invoice langsung dengan IDRX
    function payInvoice(uint256 invoiceId) external {
        InvoiceData storage inv = _invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        if (inv.status == InvoiceStatus.Paid) revert InvoiceAlreadyPaid();
        if (inv.status == InvoiceStatus.Cancelled) revert InvoiceAlreadyCancelled();

        uint256 totalAmount = inv.amount + inv.fee;

        // Transfer IDRX dari payer ke merchant
        idrx.safeTransferFrom(msg.sender, inv.merchant, inv.amount);
        
        // Transfer fee ke owner (deployer)
        if (inv.fee > 0) {
            idrx.safeTransferFrom(msg.sender, owner, inv.fee);
        }

        inv.payer = msg.sender;
        inv.paidAt = block.timestamp;
        inv.status = InvoiceStatus.Paid;

        emit InvoicePaid(invoiceId, msg.sender, totalAmount);
    }

    /// @notice Membayar invoice via DeQRyptRouter (swap token lain ke IDRX)
    /// @param invoiceId ID invoice yang akan dibayar
    /// @param tokenIn Token yang digunakan untuk membayar (misal USDC)
    /// @param amountIn Jumlah token yang dikirim
    /// @param minOut Minimum IDRX yang diterima (slippage protection)
    /// @param deadline Batas waktu transaksi
    function payInvoiceViaRouter(
        uint256 invoiceId,
        address tokenIn,
        uint256 amountIn,
        uint256 minOut,
        uint256 deadline
    ) external {
        InvoiceData storage inv = _invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        if (inv.status == InvoiceStatus.Paid) revert InvoiceAlreadyPaid();
        if (inv.status == InvoiceStatus.Cancelled) revert InvoiceAlreadyCancelled();

        // Transfer tokenIn dari payer ke contract ini
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve router untuk spend tokenIn
        IERC20(tokenIn).approve(address(router), amountIn);

        // Pay via router - IDRX akan dikirim ke merchant
        bytes32 refId = bytes32(invoiceId);
        router.pay(tokenIn, amountIn, minOut, inv.merchant, refId, deadline);

        // Note: Fee handling via router perlu disesuaikan
        // Untuk MVP, fee diabaikan saat bayar via router

        inv.payer = msg.sender;
        inv.paidAt = block.timestamp;
        inv.status = InvoiceStatus.Paid;

        emit InvoicePaid(invoiceId, msg.sender, inv.amount);
    }

    /// @notice Membatalkan invoice (hanya merchant)
    function cancelInvoice(uint256 invoiceId) external {
        InvoiceData storage inv = _invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        if (inv.status == InvoiceStatus.Paid) revert InvoiceAlreadyPaid();
        if (inv.status == InvoiceStatus.Cancelled) revert InvoiceAlreadyCancelled();
        if (msg.sender != inv.merchant) revert OnlyMerchantCanCancel();

        inv.status = InvoiceStatus.Cancelled;

        emit InvoiceCancelled(invoiceId);
    }

    /// @notice Mendapatkan jumlah total invoice yang dibuat
    function totalInvoices() external view returns (uint256) {
        return _nextInvoiceId - 1;
    }
}
