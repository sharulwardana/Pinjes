import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { TEST_DATABASE_URL, TEST_DB_FILE } from "./db-url";

export default function setup() {
    for (const suffix of ["", "-journal", "-wal", "-shm"]) {
        if (existsSync(TEST_DB_FILE + suffix)) rmSync(TEST_DB_FILE + suffix);
    }
    execSync("npx prisma db push", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    });
}