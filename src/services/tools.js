import rateLimiter from "express-rate-limit"
import speedLimiter from "express-slow-down"

export const heavyRateLimiter = rateLimiter({ windowMs: 60000, max: 5 })
export const normalSpeedLimiter = speedLimiter({ windowMs: 60000, delayAfter: 60, delayMs: 1000 })
