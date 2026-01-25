"use client";

import { useState } from "react";
import { payWithApprove } from "../constant/pay";
import { USDC } from "../constant/smartContract";

export default function PayButton() {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  async function onPay() {
    setLoading(true);
    setErr("");
    setReceipt(null);
    try {
      const res = await payWithApprove({
        tokenIn: USDC,
        recipient: "0xF4CA1D7525651E818afACE520C46C700588d160A", // merchant
        amountHuman: "1",
        slippageBps: 0,
        referenceIdStr: "INV-0001",
      });
      setReceipt(res);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button disabled={loading} onClick={onPay}>
        {loading ? "Processing..." : "Pay 1 USDC"}
      </button>

      {err && <pre style={{ color: "red" }}>{err}</pre>}
      {receipt && <pre>{JSON.stringify(receipt, null, 2)}</pre>}
    </div>
  );
}
