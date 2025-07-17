import esbuild from "esbuild";
import { rmSync } from "fs";

// Remove the previous build directory
rmSync("./index.js", { recursive: true, force: true });

const options = {
  // Entry point for the build
  entryPoints: ["index.ts"],
  // Output file path
  outfile: "index.js",
  // Bundle all dependencies into a single file
  bundle: true,
  // Target Node.js platform
  platform: "node",
  // Target Node.js v20
  target: "node20",
  // Use ES modules format
  format: "esm",
  // TypeScript configuration file
  tsconfig: "./tsconfig.json",
  // Mark all node_modules as external to avoid bundling issues
  packages: "external",
  // Add banner to handle ES modules properly (without shebang as it's already in source)
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  // Ensure proper module resolution
  mainFields: ["module", "main"],
  conditions: ["import", "module", "default"],
};

if (process.argv.includes("--watch")) {
  async function watch() {
    let ctx = await esbuild.context(options);
    await ctx.watch();
    console.log("Watching...");
  }
  watch();
} else {
  // Run esbuild with the specified options
  esbuild.build(options).catch(() => process.exit(1));
}
