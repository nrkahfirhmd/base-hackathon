// constants.ts
export const CHAIN_ID = 84532; // Base Sepolia

export const USDC = "0x453f6011493c1Cb55a7cB3182B48931654490bE3";
export const IDRX = "0x1d094171C5c56692c602DcF4580385eeeFEd0A5d";
export const ROUTER = "0xC9Af2FA70A49610b7B4357b696BA168642AEd6AA";
export const TREASURY = "0xE949b7064FEB13497cd5E67170a1106F100B45Cb";

// Minimal ABI
export const ROUTER_ABI = [
  "function pay(address tokenIn,uint256 amountIn,uint256 minOutIDRX,address recipient,bytes32 referenceId,uint256 deadline) external returns (uint256)",
  "event PaymentSuccess(address indexed payer,address indexed recipient,address indexed tokenIn,uint256 amountIn,uint256 amountOutIDRX,bytes32 referenceId)",
];

export const ERC20_ABI = [
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

// Rate rule (Mode B simulated swap): 1 USDC -> 15,000 IDRX
export const USDC_TO_IDRX = 15_000n;
export const DECIMALS = 6; // USDC + IDRX mocks = 6
