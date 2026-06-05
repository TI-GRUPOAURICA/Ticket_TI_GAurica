import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Portal Soporte TI - Grupo Aurica',
        short_name: 'Soporte TI',
        description: 'Sistema de tickets de soporte tecnológico',
        theme_color: '#345D9D',
        background_color: '#345D9D',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192-B.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512-B.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512-B.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})