import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tsconfigpaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [svelte(), tsconfigpaths()],
});
