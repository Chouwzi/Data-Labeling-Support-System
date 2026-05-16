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
        server.middlewares.use('/api/v1/uploads', (req, res, next) => {
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
            next();
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
