// lib/solana.ts — all Solana RPC helpers

const RPC = "https://api.mainnet-beta.solana.com";

export async function getSolBalance(publicKey: string): Promise<number> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [publicKey],
    }),
  });
  const data = await res.json();
  if (data.result?.value !== undefined) {
    return data.result.value / 1_000_000_000;
  }
  return 0;
}

export async function getRecentTransactions(publicKey: string, limit = 10) {
  const sigRes = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [publicKey, { limit }],
    }),
  });
  const sigData = await sigRes.json();
  return sigData.result || [];
}

export async function getTransaction(signature: string) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
        signature,
        { encoding: "json", maxSupportedTransactionVersion: 0 },
      ],
    }),
  });
  const data = await res.json();
  return data.result;
}

// Shorten wallet address for display
export function shortAddr(addr: string, chars = 4) {
  if (!addr) return "";
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

// Format SOL amount
export function formatSol(amount: number, decimals = 4) {
  return amount.toFixed(decimals);
}
