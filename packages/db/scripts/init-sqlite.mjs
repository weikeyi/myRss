import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(scriptDir, "../../data");

fs.mkdirSync(dataDir, { recursive: true });
process.env.DATABASE_URL ??= "file:../../data/myrss.db";

const result = spawnSync(
  "prisma",
  [
    "db",
    "push",
    "--schema",
    "prisma/schema.prisma",
    "--skip-generate",
    "--accept-data-loss"
  ],
  {
    stdio: "inherit",
    shell: true,
    env: process.env
  }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
