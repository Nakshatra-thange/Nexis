import express from "express";
import cors from "cors";
import { prisma } from "./src/database/prisma";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/connect", async (req, res) => {
  const { token, walletAddress } = req.body;

  if (!token || !walletAddress) {
    return res.status(400).json({ error: "Missing token or wallet address" });
  }

  const session = await prisma.session.findUnique({
    where: { connection_token: token },
  });

  if (!session) {
    return res.status(404).json({ error: "Invalid or expired token" });
  }

  await prisma.session.update({
    where: { session_id: session.session_id },
    data: {
      wallet_address: walletAddress,
      status: "connected",
      last_used_at: new Date(),
    },
  });

  res.json({ success: true });
});

app.listen(3001, () => {
  console.log("API server running on http://localhost:3001");
});
