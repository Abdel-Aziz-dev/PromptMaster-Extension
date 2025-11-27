
interface RateLimitData {
  count: number;
  resetTime: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute per IP

const limitMap = new Map<string, RateLimitData>();

export const checkRateLimit = (clientId: string): boolean => {
  const now = Date.now();
  const record = limitMap.get(clientId);

  if (!record || now > record.resetTime) {
    limitMap.set(clientId, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
};
