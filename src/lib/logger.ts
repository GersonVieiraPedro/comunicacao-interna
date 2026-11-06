type LogFields = Record<string, unknown>;

const SENSITIVE = /secret|password|token|authorization|cookie|connectionstring|database_url/i;

function sanitize(fields?: LogFields): LogFields | undefined {
  if (!fields) return fields;
  const next: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    next[key] = SENSITIVE.test(key) ? "[redacted]" : value;
  }
  return next;
}

function write(level: string, message: string, fields?: LogFields) {
  const line = JSON.stringify({
    level,
    msg: message,
    time: new Date().toISOString(),
    ...sanitize(fields),
  });
  if (level === "error") console.error(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
