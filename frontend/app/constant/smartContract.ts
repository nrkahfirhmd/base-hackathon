// constants.ts
export const CHAIN_ID = 84532; // Base Sepolia

export const ROUTER = "0x3F0d70EBC91eaEA590d18e4a8dC258993581EDec";
export const USDC = "0x2b76EC0FfFd7BB736d29931e1dd16Bf6285740eB";
export const IDRX = "0x71894d7dE68cDC34eA756A7e557d3bd0b0086FAA";

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
