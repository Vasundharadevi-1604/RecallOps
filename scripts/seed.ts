import { seedDemoData } from "../src/services/incident.service";
import { logger } from "../src/utils/logger";

async function main() {
  const force = process.argv.includes("--force");
  const result = await seedDemoData(force);
  console.log(result.message);
  if (result.retainFailures) {
    console.warn(`Warning: Hindsight retention failed for ${result.retainFailures} seed item(s). SQLite data was inserted, but these memories were not retained.`);
  }
  logger.info(result, "Seed completed.");
}

main().catch(error => {
  logger.error({ err: error }, "Seed failed");
  process.exitCode = 1;
});

