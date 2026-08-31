import "dotenv/config";
import { startRepositoryAnalysisWorker } from "./repository-analysis/worker";
import { logger } from "@/shared/logger";

logger.info("Starting DevPort BullMQ background workers...");

const analysisWorker = startRepositoryAnalysisWorker();

logger.info("DevPort workers are running and listening for queue events.");

// Graceful shutdown handling
async function shutdown() {
  logger.info("Shutting down workers...");
  await analysisWorker.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
