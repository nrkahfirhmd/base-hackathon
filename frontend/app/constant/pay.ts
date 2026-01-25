// web3Pay.ts

declare global {
  interface Window {
    ethereum?: any;
  }
}
import {
  BrowserProvider,
  Contract,
  parseUnits,
  formatUnits,
  id,
  getAddress,
} from "ethers";
import {
  ROUTER,
  ROUTER_ABI,
  ERC20_ABI,
  USDC_TO_IDRX,
  DECIMALS,
} from "./smartContract";

/**
 * Helper: format "INV-0001" -> bytes32
 * NOTE: ethers v6: encodeBytes32String
 */
import { encodeBytes32String } from "ethers";

export type PayParams = {
  tokenIn: string; // USDC or IDRX address
  recipient: string; // merchant wallet
  amountHuman: string; // "1" for 1 USDC
  slippageBps?: number; // 0..100 = 0%..1% (basis points)
  referenceIdStr: string; // "INV-0001"
  deadlineSeconds?: number; // default 3600
};

export type PayReceipt = {
  txHash: string;
  payer: string;
  recipient: string;
  tokenIn: string;
  amountIn: bigint;
  amountOutIDRX: bigint;
  referenceId: string;
  amountInHuman: string;
  amountOutHuman: string;
};

/**
 * Core flow:
 * 1) connect provider + signer
 * 2) compute amountIn
 * 3) compute expectedOut + minOut (slippage)
 * 4) allowance check + approve if needed
 * 5) call pay()
 * 6) parse PaymentSuccess from receipt logs
 */
export async function payWithApprove(p: PayParams): Promise<PayReceipt> {
  if (!window.ethereum)
    throw new Error(
      "No wallet found (window.ethereum). Install MetaMask/Coinbase Wallet.",
    );

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const payerAddr = await signer.getAddress();

  const tokenIn = getAddress(p.tokenIn);
  const recipient = getAddress(p.recipient);

  const token = new Contract(tokenIn, ERC20_ABI, signer);
  const router = new Contract(ROUTER, ROUTER_ABI, signer);

  const amountIn = parseUnits(p.amountHuman, DECIMALS); // 6 decimals

  // expectedOutIDRX:
  // - if tokenIn is IDRX => 1:1 (amountIn)
  // - else (USDC) => amountIn * 15000 (because same decimals)
  // NOTE: This matches your contract logic: amountOut = (amountIn * rateScaled1e6) / 1e6
  const isIDRX = false; // optional: FE can compare with constants.IDRX
  const expectedOutIDRX = isIDRX ? amountIn : amountIn * USDC_TO_IDRX;

  const slippageBps = p.slippageBps ?? 0; // e.g. 100 = 1%
  const minOutIDRX = (expectedOutIDRX * BigInt(10_000 - slippageBps)) / 10_000n;

  // Allowance check
  const allowance: bigint = await token.allowance(payerAddr, ROUTER);
  if (allowance < amountIn) {
    const txApprove = await token.approve(ROUTER, amountIn);
    await txApprove.wait();
  }

  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + (p.deadlineSeconds ?? 3600),
  );
  const refBytes32 = encodeBytes32String(p.referenceIdStr);

  const txPay = await router.pay(
    tokenIn,
    amountIn,
    minOutIDRX,
    recipient,
    refBytes32,
    deadline,
  );
  const receipt = await txPay.wait();

  // Parse PaymentSuccess
  const topic0 = id(
    "PaymentSuccess(address,address,address,uint256,uint256,bytes32)",
  );

  let parsed: any = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ROUTER.toLowerCase()) continue;
    if (!log.topics || log.topics.length === 0) continue;
    if (log.topics[0].toLowerCase() !== topic0.toLowerCase()) continue;

    // ethers can parse if you create an Interface, easiest via Contract.interface
    parsed = router.interface.parseLog({ topics: log.topics, data: log.data });
    break;
  }
  if (!parsed) throw new Error("PaymentSuccess event not found in tx logs.");

  const {
    payer,
    recipient: rcpt,
    tokenIn: tIn,
    amountIn: aIn,
    amountOutIDRX,
    referenceId,
  } = parsed.args;

  // decode bytes32 back to string (ethers v6 has decodeBytes32String)
  const { decodeBytes32String } = await import("ethers");
  const refStr = decodeBytes32String(referenceId);

  return {
    txHash: receipt.hash,
    payer,
    recipient: rcpt,
    tokenIn: tIn,
    amountIn: aIn,
    amountOutIDRX,
    referenceId: refStr,
    amountInHuman: formatUnits(aIn, DECIMALS),
    amountOutHuman: formatUnits(amountOutIDRX, DECIMALS),
  };
}
