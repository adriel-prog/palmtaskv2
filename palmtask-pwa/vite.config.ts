
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'PalmTask PWA',
        short_name: 'PalmTask',
        description: 'Gerenciamento de tarefas e vendas offline',
        theme_color: '#FFD400',
        background_color: '#F8F9FA',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/4345/4345573.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/4345/4345573.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
           {
              src: "https://placehold.co/1080x1920/F8F9FA/1A1A1A.png?text=PalmTask+Mobile",
              sizes: "1080x1920",
              type: "image/png",
              form_factor: "narrow"
           },
           {
              src: "https://placehold.co/1920x1080/F8F9FA/1A1A1A.png?text=PalmTask+Desktop",
              sizes: "1920x1080",
              type: "image/png",
              form_factor: "wide"
           }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Cache para bibliotecas do CDN (esm.sh) para funcionar offline
            urlPattern: ({ url }) => url.origin.includes('esm.sh'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-libs-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Sheets CSVs (Data)
            urlPattern: ({ url }) => url.origin.includes('docs.google.com') && url.pathname.includes('/spreadsheets/'),
            handler: 'NetworkFirst', // Tries network, falls back to cache if offline
            options: {
              cacheName: 'data-sheets-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          },
          {
            // Cache Product Images (Google Drive/Content) and Whatsapp/Facebook CDN
            urlPattern: ({ url }) => url.origin.includes('googleusercontent.com') || url.origin.includes('drive.google.com') || url.origin.includes('whatsapp.net') || url.origin.includes('fbcdn.net'),
            handler: 'StaleWhileRevalidate', // Serves cache immediately, updates in background
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ url }) => url.origin.includes('cdn-icons-png.flaticon.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'icon-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 
              }
            }
          },
          {
            urlPattern: ({ url }) => url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ignora estas libs no bundle, pois elas virão do importmap (CDN)
    rollupOptions: {
      external: ['jspdf', 'jspdf-autotable']
    }
  }
})
