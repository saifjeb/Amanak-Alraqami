const isTest =
  process.env.NODE_ENV === "test";

const isProd =
  process.env.NODE_ENV === "production";

const reservedFields =
  new Set([
    "timestamp",
    "level",
    "event",
  ]);

const normalizeFields = (fields) => {
  if (
    !fields ||
    typeof fields !== "object" ||
    Array.isArray(fields)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fields).filter(
      ([key]) => !reservedFields.has(key),
    ),
  );
};

export const serializeError = (error) => {
  const result = {
    name:
      error?.name ||
      "Error",

    code:
      error?.code ||
      null,
  };

  if (!isProd) {
    result.message =
      typeof error?.message === "string"
        ? error.message
        : String(error);

    result.stack =
      typeof error?.stack === "string"
        ? error.stack
        : null;
  }

  return result;
};

const writeLog = (
  level,
  event,
  fields = {},
) => {
  if (isTest) {
    return;
  }

  const payload = {
    timestamp:
      new Date().toISOString(),

    ...normalizeFields(fields),

    level,

    event,
  };

  const line =
    JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logger = {
  info(event, fields) {
    writeLog(
      "info",
      event,
      fields,
    );
  },

  warn(event, fields) {
    writeLog(
      "warn",
      event,
      fields,
    );
  },

  error(event, fields) {
    writeLog(
      "error",
      event,
      fields,
    );
  },
};