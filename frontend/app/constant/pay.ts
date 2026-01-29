// pay.ts
import {
  Contract,
  parseUnits,
  formatUnits,
  id,
  getAddress,
  JsonRpcSigner,
} from "ethers";
import { encodeBytes32String, decodeBytes32String } from "ethers";
import {
  ROUTER,
  ROUTER_ABI,
  ERC20_ABI,
  USDC_TO_IDRX,
  DECIMALS,
} from "./smartContract";

// ... (Type PayParams & PayReceipt tetap sama)

export async function payWithApprove(
  p: PayParams,
  signer: JsonRpcSigner,
): Promise<PayReceipt> {
  // 1. Hapus pengecekan window.ethereum manual
  const payerAddr = await signer.getAddress();
  const tokenIn = getAddress(p.tokenIn);
  const recipient = getAddress(p.recipient);

  const token = new Contract(tokenIn, ERC20_ABI, signer);
  const router = new Contract(ROUTER, ROUTER_ABI, signer);

  const amountIn = parseUnits(p.amountHuman, DECIMALS);
  const expectedOutIDRX = amountIn * USDC_TO_IDRX;
  const slippageBps = p.slippageBps ?? 0;
  const minOutIDRX = (expectedOutIDRX * BigInt(10_000 - slippageBps)) / 10_000n;

  // 2. Allowance check & Approve
  const allowance: bigint = await token.allowance(payerAddr, ROUTER);
  if (allowance < amountIn) {
    const txApprove = await token.approve(ROUTER, amountIn);
    await txApprove.wait();
  }

  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + (p.deadlineSeconds ?? 3600),
  );
  const refBytes32 = encodeBytes32String(p.referenceIdStr);

  // 3. Call Pay
  const txPay = await router.pay(
    tokenIn,
    amountIn,
    minOutIDRX,
    recipient,
    refBytes32,
    deadline,
  );
  const receipt = await txPay.wait();

  // 4. Parse Event (Logika tetap sama)
  const topic0 = id(
    "PaymentSuccess(address,address,address,uint256,uint256,bytes32)",
  );
  let parsed: any = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ROUTER.toLowerCase()) continue;
    if (log.topics[0].toLowerCase() !== topic0.toLowerCase()) continue;
    parsed = router.interface.parseLog({
      topics: log.topics as string[],
      data: log.data,
    });
    break;
  }

  if (!parsed) throw new Error("PaymentSuccess event not found.");

  const {
    payer,
    recipient: rcpt,
    tokenIn: tIn,
    amountIn: aIn,
    amountOutIDRX: aOut,
    referenceId,
  } = parsed.args;
  const refStr = decodeBytes32String(referenceId);

  return {
    txHash: receipt.hash,
    payer,
    recipient: rcpt,
    tokenIn: tIn,
    amountIn: aIn,
    amountOutIDRX: aOut,
    referenceId: refStr,
    amountInHuman: formatUnits(aIn, DECIMALS),
    amountOutHuman: formatUnits(aOut, DECIMALS),
  };
}
