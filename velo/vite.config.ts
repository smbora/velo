import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    reporters: process.env.GITHUB_ACTIONS
      ? [
          "default",
          [
            "github-actions",
            {
              onWritePath(path: string) {
                const workspace = process.env.GITHUB_WORKSPACE ?? "";
                const normalized = path.replace(/\\/g, "/");
                if (workspace && normalized.startsWith(workspace)) {
                  return normalized;
                }
                return `${workspace}/velo/${normalized.replace(/^\.\//, "")}`;
              },
            },
          ],
        ]
      : ["default"],
  },
});
