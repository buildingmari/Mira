import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'figma-asset-resolver',
      resolveId(id) {
        if (id.startsWith('figma:asset/')) {
          return '\0figma-asset-placeholder'
        }
      },
      load(id) {
        if (id === '\0figma-asset-placeholder') {
          return 'export default ""'
        }
      }
    }
  ],
})
