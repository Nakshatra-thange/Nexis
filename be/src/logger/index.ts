
import pino from 'pino';
//import { createStream } from 'pino-seq'
//import { createStream } from "pino-rotating-file-stream";
import { createStream } from "rotating-file-stream";
import path from "path";
import fs from "fs";

const logDir = path.resolve(__dirname, "../../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const stream = createStream("app.log", {
  path: logDir,
  interval: "1d", // rotate daily
  size: "10M", // rotate if >10MB
  compress: "gzip",
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  stream
);
