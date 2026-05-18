import { spawnSync } from "node:child_process";

process.env.DATABASE_URL ??= "file:../../data/myrss.db";

const result = spawnSync("prisma", process.argv.slice(2), {
  stdio: "inherit",
  shell: true,
  env: process.env
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
