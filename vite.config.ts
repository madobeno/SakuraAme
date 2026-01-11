import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    // リポジトリ名と完全に一致させる（大文字・小文字に注意！）
    base: "/SakuraAme/", 
    plugins: [react()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        // ここを "./src" にするのが一般的やで
        "@": path.resolve(__dirname, "./src"), 
      },
    },
    // ビルド後のファイル出力先を明確にする
    build: {
      outDir: "dist",
    }
  };
});