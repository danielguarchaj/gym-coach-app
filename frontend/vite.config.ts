import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base path matches the GitHub Pages repo name — update if repo name changes
  base: '/gym-coach-app/',
})
