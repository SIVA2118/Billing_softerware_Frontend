import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const configuredApiBaseUrl = (env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const proxyTarget = env.VITE_PROXY_TARGET
        || (configuredApiBaseUrl.startsWith('http') ? configuredApiBaseUrl.replace(/\/api$/, '') : '')
        || 'https://agencies-billing.onrender.com'

    return {
        plugins: [react()],
        server: {
            port: 3000,
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true
                }
            }
        }
    }
})
