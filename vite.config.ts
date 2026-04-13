import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isLanding = mode === 'landing'
  const buildMode = isLanding ? 'landing' : mode === 'app' ? 'app' : 'app'

  return {
    // tailwindcss() must run before vue() so @import "tailwindcss" is expanded
    // before CSS chunks merge (otherwise @import can end up after other rules and utilities won't emit).
    plugins: [tailwindcss(), vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: isLanding ? 'dist-landing' : 'dist',
      rollupOptions: {
        output: {
          manualChunks: isLanding
            ? {
                // Landing sayfası için optimize edilmiş chunk'lar
                'landing-vendor': ['vue', 'vue-router', 'vue-i18n'],
                'landing-ui': ['lucide-vue-next'],
              }
            : {
                // App için optimize edilmiş chunk'lar
                'app-vendor': ['vue', 'vue-router', 'vue-i18n', 'pinia'],
                'app-ui': ['primevue', 'lucide-vue-next'],
                'app-calendar': ['@fullcalendar/core', '@fullcalendar/vue3'],
                'app-charts': ['apexcharts', 'vue3-apexcharts'],
              },
        },
      },
      // Chunk size limitleri
      chunkSizeWarningLimit: 1000,
    },
    define: {
      // Build mode'u runtime'da erişilebilir yap
      __VITE_BUILD_MODE__: JSON.stringify(buildMode),
    },
  }
})