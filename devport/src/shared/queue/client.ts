import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Singleton Redis connection for BullMQ
let redisConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        // Backoff retry strategy capped at 30 seconds
        return Math.min(times * 2000, 30000);
      },
    });

    redisConnection.on("error", (err: { code?: string; message?: string }) => {
      // Suppress normal idle disconnect / offline reconnection noise (Upstash / local dev)
      if (
        err.code === "ECONNREFUSED" ||
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT"
      ) {
        return;
      }
      console.error("[Redis Queue Warning]", err.message ?? err);
    });
  }
  return redisConnection;
}

// Queue names — centralized to avoid typos
export const QUEUE_NAMES = {
  REPOSITORY_ANALYSIS: "repository-analysis",
  PROJECT_SYNC: "project-sync",
  AI_PROCESSING: "ai-processing",
  OPENAPI_PROCESSING: "openapi-processing",
  NOTIFICATIONS: "notifications",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job type definitions
export interface RepositoryAnalysisJobData {
  projectId: string;
  repositoryId: string;
  userId: string;
  githubFullName: string;
  defaultBranch: string;
}

export interface ProjectSyncJobData {
  projectId: string;
  userId: string;
  triggeredBy: "MANUAL" | "WEBHOOK" | "SCHEDULED";
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// Create a queue
export function createQueue<T = unknown>(name: QueueName): Queue<T> {
  return new Queue<T>(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000, // 5s, 25s, 125s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  });
}

// Create a worker
export function createWorker<T = unknown>(
  name: QueueName,
  processor: (job: import("bullmq").Job<T>) => Promise<void>,
  options?: Partial<import("bullmq").WorkerOptions>
): Worker<T> {
  return new Worker<T>(name, processor, {
    connection: getRedisConnection(),
    concurrency: 2,
    ...options,
  });
}
