const ISO_UTC_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isIsoUtcDateTimeString(value: string): boolean {
  return ISO_UTC_DATE_TIME_PATTERN.test(value);
}

export function formatUtcDateTime(date: Date): string {
  const isoString = date.toISOString();

  return `${isoString.slice(0, 19)}Z`;
}

export function getCurrentUtcDateTime(): string {
  return formatUtcDateTime(new Date());
}

export function normalizeUtcDateTimeString(value: string): string {
  if (!isIsoUtcDateTimeString(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO datetime value: "${value}".`);
  }

  return formatUtcDateTime(date);
}

export function normalizeUtcDateTimes<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeUtcDateTimeString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUtcDateTimes(item)) as T;
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        return [key, normalizeUtcDateTimes(item)];
      }),
    ) as T;
  }

  return value;
}

export function parseAndNormalizeUtcJson<T>(value: string, key: string): T {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value) as JsonValue;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON value for key "${key}": ${
        error instanceof Error ? error.message : "Unknown parsing error."
      }`,
    );
  }

  return normalizeUtcDateTimes(parsedValue) as T;
}

export function normalizeJsonRequestBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") {
    return body;
  }

  const trimmedBody = body.trim();

  if (trimmedBody.length === 0) {
    return body;
  }

  try {
    const parsedBody = JSON.parse(trimmedBody) as JsonValue;
    return JSON.stringify(normalizeUtcDateTimes(parsedBody));
  } catch {
    return body;
  }
}
