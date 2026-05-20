import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to serve backend uploads during development
    // This allows the frontend to display local images from the backend/uploads folder
    {
      name: 'serve-backend-uploads',
      configureServer(server) {
        server.middlewares.use('/api/v1/uploads', (req, res) => {
          // Remove query params if any
          const urlPath = req.url.split('?')[0];
          // Construct the path to the backend uploads folder
          // Assuming backend is in a sibling directory named 'backend'
          const uploadsDir = path.resolve(__dirname, '../backend/uploads');
          const filePath = path.join(uploadsDir, urlPath);

          if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            // Determine content type based on extension
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.webp': 'image/webp',
              '.gif': 'image/gif'
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
          } else {
            const safeName = path.basename(urlPath).replace(/[&<>]/g, '');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/svg+xml');
            res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="#f3f4f6"/><rect x="82" y="96" width="156" height="112" rx="12" fill="none" stroke="#9ca3af" stroke-width="8"/><circle cx="126" cy="132" r="14" fill="#9ca3af"/><path d="M96 192l48-48 34 34 22-22 34 36" fill="none" stroke="#9ca3af" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><text x="160" y="242" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#6b7280">Missing local file</text><text x="160" y="264" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">${safeName}</text></svg>`);
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
