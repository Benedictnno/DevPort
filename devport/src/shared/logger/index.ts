type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  userId?: string;
  projectId?: string;
  jobId?: string;
  integrationId?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // In production use a real structured logger (Pino, Winston, etc.)
  // For now, output JSON to stdout/stderr
  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
};
