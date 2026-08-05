/**
 * Static-hosting SPA fallback emitter (Azure Storage static website / SWA).
 *
 * TanStack Start's SPA build emits only `dist/client/_shell.html`. Azure Blob
 * static websites ignore `staticwebapp.config.json` and serve deep links via
 * the configured index/error documents, so a missing `index.html` / `404.html`
 * makes routes such as /apply/resume?token=... return a hard 404 instead of the
 * app shell. Copy the shell to both filenames after the build.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "dist", "client");
const shell = join(outDir, "_shell.html");

if (!existsSync(shell)) {
  console.warn("[spa-fallback] dist/client/_shell.html not found — skipping.");
  process.exit(0);
}

for (const name of ["index.html", "404.html"]) {
  copyFileSync(shell, join(outDir, name));
  console.log(`[spa-fallback] wrote dist/client/${name}`);
}
