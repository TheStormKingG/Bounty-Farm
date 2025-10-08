import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    // ✅ add base EXACTLY as your repo name (case-sensitive)
    base: '/Bounty-Farm/',

    server: { port: 3000, host: '0.0.0.0' },
    plugins: [react()],

    // ✅ Prefer Vite-style envs; keep define only if you truly read process.env.*
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: { alias: { '@': path.resolve(__dirname, '.') } }
  }
})
