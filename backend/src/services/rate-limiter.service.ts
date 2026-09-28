import { redisConnection } from '../queues/redis.js';

interface RateLimitResult {
  allowed: boolean;
  nextAllowedAt: number;
  hourlyLimitReached: boolean;
}

const script = `
local countKey = KEYS[1]
local nextKey = KEYS[2]

local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local delay = tonumber(ARGV[3])
local window = tonumber(ARGV[4])

local count = tonumber(redis.call('GET', countKey) or '0')

if count >= limit then
  local windowEnd = math.floor(now / window) * window + window
  return {0, windowEnd, 1}
end

local previousNext = tonumber(redis.call('GET', nextKey) or '0')
local allowedAt = math.max(now, previousNext)

redis.call('INCR', countKey)
redis.call('EXPIRE', countKey, math.ceil(window / 1000) + 60)

redis.call('SET', nextKey, allowedAt + delay)
redis.call('PEXPIRE', nextKey, delay + 3600000)

return {1, allowedAt, 0}
`;

export async function checkRateLimit(
  senderId: string,
  hourlyLimit: number,
  delayMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;

  const countKey = `email-rate:${senderId}:${Math.floor(now / windowMs)}`;
  const nextKey = `email-next:${senderId}`;

  const result = (await redisConnection.eval(
    script,
    2,
    countKey,
    nextKey,
    now,
    hourlyLimit,
    delayMs,
    windowMs,
  )) as [number, number, number];

  return {
    allowed: result[0] === 1,
    nextAllowedAt: result[1],
    hourlyLimitReached: result[2] === 1,
  };
}