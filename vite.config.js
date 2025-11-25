import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Quan trọng: Base path cho việc deploy vào sub-folder (vd: /remove-bg/)
    // Mặc định là '/' nếu không có biến môi trường
    base: env.PUBLIC_PATH || '/', 
    
    plugins: [react()],
    build: {
      target: 'es2020',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            transformers: ['@huggingface/transformers']
          }
        }
      },
      chunkSizeWarningLimit: 2000,
    },
    optimizeDeps: {
      exclude: ['@huggingface/transformers']
    }
  }
});
