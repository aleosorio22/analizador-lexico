import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // En GitHub Actions se usa '/analizador-lexico/', localmente '/'
  base: process.env.GITHUB_ACTIONS ? '/analizador-lexico/' : '/',
  plugins: [react()],
})
