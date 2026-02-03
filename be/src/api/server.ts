import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { apiRateLimit } from "./middleware/rateLimit";

import { connectRouter } from "./routes/connect";
import { sessionRouter } from "./routes/session";
import { transactionRouter } from "./routes/transaction";
import transactionSignRoute from "./routes/transactionSign";
import transactionStatusRoute from "./routes/transactionStatus";
const app = express();

app.use(express.json());
app.use(transactionStatusRoute);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(transactionSignRoute);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
  })
);

app.use(apiRateLimit(50, 60 * 60 * 1000));

app.use("/api/connect", connectRouter);
app.use("/api/session", sessionRouter);
app.use("/api/transaction", transactionRouter);

export default app;
