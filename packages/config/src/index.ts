import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().default("file:../../data/myrss.db"),
  PORT: z.coerce.number().int().positive().default(3000)
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  return EnvSchema.parse(env);
}
