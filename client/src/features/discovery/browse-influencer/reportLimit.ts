export type ReportLimitError = Error & {
  isReportLimitExceeded?: boolean;
  status?: number;
  payload?: unknown;
};

function stringifyErrorValue(value: unknown, seen = new WeakSet<object>()): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map((item) => stringifyErrorValue(item, seen)).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '';
    seen.add(value);

    const record = value as Record<string, unknown>;

    const priorityText = [
      record.message,
      record.msg,
      record.error,
      record.reason,
      record.code,
      record.type,
      record.name,
      record.detail,
      record.details,
      record.description,
      record.data,
      record.errors,
      record.response,
    ]
      .map((item) => stringifyErrorValue(item, seen))
      .filter(Boolean)
      .join(' ');

    const fullText = Object.values(record)
      .map((item) => stringifyErrorValue(item, seen))
      .filter(Boolean)
      .join(' ');

    return [priorityText, fullText].filter(Boolean).join(' ');
  }

  return '';
}

export function getApiErrorMessage(
  payload: unknown,
  fallback = 'Something went wrong'
): string {
  if (!payload || typeof payload !== 'object') return fallback;

  const record = payload as Record<string, unknown>;
  const message = stringifyErrorValue(record.message || record.msg).trim();
  if (message) return message;

  const error = stringifyErrorValue(record.error).trim();
  if (error) return error;

  const detail = stringifyErrorValue(record.detail || record.details).trim();
  if (detail) return detail;

  return fallback;
}

export function isReportLimitExceededPayload(
  payload: unknown,
  status?: number
): boolean {
  const text = stringifyErrorValue(payload).toLowerCase();

  const hasLimitLanguage =
    /report\s*(limit|quota)/i.test(text) ||
    /profile[\s_-]*view(s)?[\s_-]*(limit|quota)/i.test(text) ||
    /monthly[\s_-]*(profile[\s_-]*view(s)?|report|creator)[\s_-]*(limit|quota)/i.test(text) ||
    /influencer[\s_-]*profile[\s_-]*view(s)?[\s_-]*per[\s_-]*month/i.test(text) ||
    /(limit|quota|credit)s?\s*(exceeded|exceed|finished|used|reached)/i.test(text) ||
    /(exceeded|exceed|reached|used)\s*(your\s*)?((monthly|profile|view|views|report|quota|credit)\s*){0,6}(limit|quota|credit)s?/i.test(text) ||
    /free\s*plan/i.test(text) ||
    /upgrade\s*to\s*continue/i.test(text);

  return status === 402 || status === 429 || hasLimitLanguage;
}

export function createReportApiError(
  payload: unknown,
  status?: number,
  fallback = 'Failed to fetch report'
): ReportLimitError {
  const error = new Error(getApiErrorMessage(payload, fallback)) as ReportLimitError;
  error.status = status;
  error.payload = payload;
  error.isReportLimitExceeded = isReportLimitExceededPayload(payload, status);
  return error;
}

export function isReportLimitExceededError(error: unknown): boolean {
  if (!error) return false;

  const typed = error as ReportLimitError;
  if (typed.isReportLimitExceeded) return true;
  if (isReportLimitExceededPayload(typed.payload, typed.status)) return true;

  return isReportLimitExceededPayload(
    {
      message: (error as any)?.message,
      error: (error as any)?.error,
      response: (error as any)?.response?.data,
    },
    (error as any)?.status || (error as any)?.response?.status
  );
}
