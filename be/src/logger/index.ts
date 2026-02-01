import pino from "pino";
import { createStream } from "pino-rotating-file-stream";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

const stream = createStream({
  path: logDir,
  interval: "1d",      // rotate daily
  size: "10M",         // rotate if >10MB
  compress: "gzip",
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  stream
);
