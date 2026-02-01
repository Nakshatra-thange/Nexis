const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function connectWallet(token: string, walletAddress: string) {
  return fetch(`${API}/api/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, walletAddress }),
  });
}

export async function checkSession(token: string) {
  return fetch(`${API}/api/session/${token}`).then(res => res.json());
}

export async function getPendingTx(txId: string) {
  return fetch(`${API}/api/transaction/${txId}`).then(res => res.json());
}

export async function submitSignedTx(txId: string, signedTx: string) {
  return fetch(`${API}/api/transaction/${txId}/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTx }),
  });
}
