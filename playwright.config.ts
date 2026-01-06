import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isCI = !!process.env.CI;

// path needed for finding backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
   testDir: './tests',
   timeout: 30_000,
   retries: 0,
   use: {
      baseURL: 'http://localhost:5173',
      headless: true,
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
   },
   webServer: isCI
      ? undefined
      : [
         {
            command: 'npm run dev',
            url: 'http://localhost:5173',
            reuseExistingServer: true,
         },
         {
            command: 'SPRING_PROFILES_ACTIVE=test ./gradlew bootRun',
            url: 'http://localhost:8080',
            reuseExistingServer: true,
            cwd: path.resolve(__dirname, '../labor-planner-backend'),
         }
      ],
});
