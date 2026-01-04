// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract DeQRyptRouter {
    error DeadlinePassed();
    error AmountZero();
    error InvalidRecipient();
    error SwapNotEnabled();

    IERC20 public immutable idrx;

    event PaymentSuccess(
        address indexed payer,
        address indexed recipient,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOutIDRX,
        bytes32 referenceId
    );

    constructor(address _idrx) {
        idrx = IERC20(_idrx);
    }

    /**
     * V1: hanya support pembayaran pakai IDRX langsung.
     * tokenIn lain => revert SwapNotEnabled().
     */
    function pay(
        address tokenIn,
        uint256 amountIn,
        uint256 minOutIDRX, // untuk V1 bisa diisi 0 atau =amountIn
        address recipient,
        bytes32 referenceId,
        uint256 deadline
    ) external returns (uint256 amountOutIDRX) {
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (amountIn == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidRecipient();

        // V1: hanya IDRX
        if (tokenIn != address(idrx)) revert SwapNotEnabled();

        // Karena tokenIn == IDRX, amountOutIDRX = amountIn
        amountOutIDRX = amountIn;

        // slippage check (buat konsisten dgn V2 nanti)
        if (amountOutIDRX < minOutIDRX) revert SwapNotEnabled(); // simple; bisa bikin error SlippageExceeded kalau mau

        // transfer IDRX langsung dari payer ke recipient
        bool ok = idrx.transferFrom(msg.sender, recipient, amountIn);
        require(ok, "TRANSFER_FROM_FAILED");

        emit PaymentSuccess(msg.sender, recipient, tokenIn, amountIn, amountOutIDRX, referenceId);
    }
}
