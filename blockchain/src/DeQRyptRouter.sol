// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}

contract DeQRyptRouter {
    using SafeERC20 for IERC20;

    // -------- Errors --------
    error Unauthorized();
    error DeadlinePassed();
    error AmountZero();
    error InvalidRecipient();
    error TokenNotAllowed();
    error RateNotSet();
    error SlippageExceeded();
    error TreasuryZero();

    // -------- State --------
    address public owner;
    address public treasury;

    IERC20 public immutable idrx;              // settlement token
    IMintableERC20 public immutable idrxMinter; // for testnet simulated swap (mock)

    mapping(address => bool) public isAllowed;       // tokenIn allowlist
    mapping(address => uint256) public rateToIDRX;   // tokenIn -> IDRX per 1 tokenIn (scaled by 1e6)

    // -------- Events --------
    event PaymentSuccess(
        address indexed payer,
        address indexed recipient,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOutIDRX,
        bytes32 referenceId
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event AllowedTokenUpdated(address indexed token, bool allowed);
    event RateUpdated(address indexed token, uint256 rateToIDRX);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _idrx, address _treasury) {
        owner = msg.sender;
        idrx = IERC20(_idrx);
        idrxMinter = IMintableERC20(_idrx);

        if (_treasury == address(0)) revert TreasuryZero();
        treasury = _treasury;
    }

    // -------- Admin --------
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert TreasuryZero();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        isAllowed[token] = allowed;
        emit AllowedTokenUpdated(token, allowed);
    }

    /// @dev rateToIDRX[token] is scaled by 1e6.
    /// Contoh: if 1 USDC -> 15,000 IDRX, set rate = 15_000e6.
    function setRate(address token, uint256 rateScaled1e6) external onlyOwner {
        rateToIDRX[token] = rateScaled1e6;
        emit RateUpdated(token, rateScaled1e6);
    }

    // -------- Core --------
    function pay(
        address tokenIn,
        uint256 amountIn,
        uint256 minOutIDRX,
        address recipient,
        bytes32 referenceId,
        uint256 deadline
    ) external returns (uint256 amountOutIDRX) {
        if (block.timestamp > deadline) revert DeadlinePassed();
        if (amountIn == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidRecipient();

        // (A) Direct IDRX -> merchant (V1 rail tetap aman)
        if (tokenIn == address(idrx)) {
            amountOutIDRX = amountIn;
            if (amountOutIDRX < minOutIDRX) revert SlippageExceeded();

            IERC20(tokenIn).safeTransferFrom(msg.sender, recipient, amountIn);

            emit PaymentSuccess(msg.sender, recipient, tokenIn, amountIn, amountOutIDRX, referenceId);
            return amountOutIDRX;
        }

        // (B) Simulated swap: tokenIn -> treasury, mint IDRX -> merchant
        if (!isAllowed[tokenIn]) revert TokenNotAllowed();

        uint256 r = rateToIDRX[tokenIn];
        if (r == 0) revert RateNotSet();

        // Move tokenIn to treasury
        IERC20(tokenIn).safeTransferFrom(msg.sender, treasury, amountIn);

        // Compute output in IDRX (both tokens assumed 6 decimals in mock; still works generally with scaling choice)
        amountOutIDRX = (amountIn * r) / 1e6;

        if (amountOutIDRX < minOutIDRX) revert SlippageExceeded();

        // Mint IDRX to merchant (hackathon/testnet)
        idrxMinter.mint(recipient, amountOutIDRX);

        emit PaymentSuccess(msg.sender, recipient, tokenIn, amountIn, amountOutIDRX, referenceId);
        return amountOutIDRX;
    }
}
