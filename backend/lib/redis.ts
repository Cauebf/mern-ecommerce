import { Redis } from "ioredis";
import doentv from "dotenv";

doentv.config();

const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
  throw new Error("UPSTASH_REDIS_URL environment variable is not set");
}

const redis = new Redis(redisUrl);
export default redis;
