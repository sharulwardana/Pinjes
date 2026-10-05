process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = "true";

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { TEST_DATABASE_URL } from "./src/test/db-url";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        globalSetup: ["./src/test/global-setup.ts"],
        env: { DATABASE_URL: TEST_DATABASE_URL },
        // Semua tes memakai satu file database, jadi file tes dijalankan satu per satu.
        fileParallelism: false,
        testTimeout: 30_000,
    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            // Paket "server-only" sengaja error di luar Next.js. Di tes diganti file kosong.
            "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
        },
    },
});