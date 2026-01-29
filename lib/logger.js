/**
 * Skooly logger – console-based implementation.
 * Use info, warn, error, debug for workflow logging.
 * Optional: install "winston" and swap to Winston for production.
 */

const level = process.env.LOG_LEVEL || "info";

function ts() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function format(level, message, meta = {}) {
  const metaStr =
    meta && typeof meta === "object" && Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : "";
  return `${ts()} [${level}]: ${message}${metaStr}`;
}

const logger = {
  info(message, meta) {
    if (level === "silent") return;
    console.info(format("info", message, meta));
  },
  warn(message, meta) {
    if (level === "silent") return;
    console.warn(format("warn", message, meta));
  },
  error(message, meta) {
    console.error(format("error", message, meta));
  },
  debug(message, meta) {
    if (level !== "debug" && level !== "trace") return;
    console.debug(format("debug", message, meta));
  },
};

export default logger;
