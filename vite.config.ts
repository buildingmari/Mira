import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
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
