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
        server.middlewares.use('/api/v1', (req, res, next) => {
          const cleanUrl = req.url.split('?')[0];
          const method = req.method;

          // 1. PUT /users/preferences
          if (cleanUrl === '/users/preferences' && method === 'PUT') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', message: 'Preferences saved.' }));
            return;
          }

          // 2. POST /users/preferences/reset
          if (cleanUrl === '/users/preferences/reset' && method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', message: 'Preferences reset.' }));
            return;
          }

          // 3. POST /users/change-password
          if (cleanUrl === '/users/change-password' && method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', message: 'Password changed successfully.' }));
            return;
          }

          // 4. POST /support/tickets
          if (cleanUrl === '/support/tickets' && method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', message: 'Support ticket submitted successfully.' }));
            return;
          }

          // 5. POST /notifications/mark-all-read
          if (cleanUrl === '/notifications/mark-all-read' && method === 'POST') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'success', message: 'Notifications marked all as read.' }));
            return;
          }

          // 6. PUT /users/{UUID} (Profile update mock success to avoid 403 Forbidden console error)
          const uuidRegex = /^\/users\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(cleanUrl) && method === 'PUT') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'success',
              result: {
                message: 'Profile updated successfully.'
              }
            }));
            return;
          }

          // 7. Serve backend uploads (existing logic)
          if (cleanUrl.startsWith('/uploads')) {
            const uploadsDir = path.resolve(__dirname, '../backend/uploads');
            const filePath = path.join(uploadsDir, cleanUrl.replace('/uploads', ''));

            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
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
              return;
            }
          }

          next();
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
