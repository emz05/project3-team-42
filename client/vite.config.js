import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            }
        }
    },
    optimizeDeps: {
        // Exclude fsevents so Vite doesn't try to bundle the .node file
        exclude: ['fsevents']
    },
    resolve: {
        alias: {
            // In case anything tries to import fsevents, ignore it
            fsevents: false
        }
    }
})
