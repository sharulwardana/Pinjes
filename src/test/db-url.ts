import path from "node:path";

export const TEST_DB_FILE = path.resolve(process.cwd(), "test.db");
export const TEST_DATABASE_URL = `file:${TEST_DB_FILE.replace(/\\/g, "/")}`;