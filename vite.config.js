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
        background_color: '#f0f4f8',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
               src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
          }
        ]
      }
    })
  ],
})