import { defineConfig } from "vitest/config";
import path from "node:path";
const database = process.env.TEST_DATABASE_URL;
if (!database || !new URL(database).pathname.includes("test")) throw new Error("Defina TEST_DATABASE_URL apontando para um banco de teste descartável (nome contendo test). Nenhum teste foi executado.");
process.env.DATABASE_URL = database;
export default defineConfig({ resolve: { alias: { "@": path.resolve("src") } }, test: { environment: "node", include: ["tests/integration/**/*.test.ts"], fileParallelism: false, testTimeout: 30000, hookTimeout: 30000 } });
