import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Vitest. The admin panel carried no tests at all until this was added.
  //
  // Same rule as the customer app: assert BEHAVIOUR, not markup. These cover
  // what an operator can and cannot do — which toggles are blocked and why,
  // what a failed save tells them, what happens when a list comes back empty.
  // Nothing here asserts a class name.
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    setupFiles: ['src/test/setup.js'],
    globals: false,
  },
  server: {
    port: 5174,
    proxy: {
      '/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
