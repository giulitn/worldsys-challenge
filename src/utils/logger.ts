import fs from "fs";
import path from "path";

const logDir = path.resolve(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFilePath = path.join(logDir, `process-${Date.now()}.log`);
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

export const logger = {
  log: (message: string) => {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] ${message}`;
    console.log(fullMessage);
    logStream.write(fullMessage + "\n");
  },

  warn: (message: string) => {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] ⚠️ ${message}`;
    console.warn(fullMessage);
    logStream.write(fullMessage + "\n");
  },

  error: (message: string | Error) => {
    const timestamp = new Date().toISOString();
    const msg =
      message instanceof Error ? message.stack || message.message : message;
    const fullMessage = `[${timestamp}] ❌ ${msg}`;
    console.error(fullMessage);
    logStream.write(fullMessage + "\n");
  },

  close: () => {
    logStream.end();
  },
};
