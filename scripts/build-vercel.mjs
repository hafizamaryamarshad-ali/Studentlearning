import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const fileEnv = loadEnv("production", process.cwd(), "");
const buildEnv = { ...fileEnv, ...process.env };

for (const name of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]) {
  if (!buildEnv[name]?.trim()) {
    throw new Error(`Missing required Vercel build variable: ${name}`);
  }
  if (buildEnv[name].trim().startsWith(`${name}=`)) {
    throw new Error(`${name} value must not include the variable name`);
  }
}

try {
  const supabaseUrl = new URL(buildEnv.NEXT_PUBLIC_SUPABASE_URL);
  if (!["http:", "https:"].includes(supabaseUrl.protocol)) throw new Error();
} catch {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
}

const viteCli = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);

const result = spawnSync(process.execPath, [viteCli, "build"], {
  stdio: "inherit",
  env: {
    ...buildEnv,
    NITRO_PRESET: "vercel",
    VINEXT_DEPLOY_TARGET: "vercel",
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
