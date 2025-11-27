
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import generateRoute from './routes/generate';
import donateRoute from './routes/donate';
import fs from 'fs';
import path from 'path';

// Helper to load SSL context
const getHttpsOptions = () => {
  // Use path.resolve() to resolve paths reliably in both CJS and ESM environments,
  // assuming the server is started from the project root.
  const rootDir = path.resolve();
  const keyPath = process.env.SSL_KEY_PATH || path.join(rootDir, 'certs', 'key.pem');
  const certPath = process.env.SSL_CERT_PATH || path.join(rootDir, 'certs', 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
    } catch (err) {
      console.error('Error reading SSL certificates:', err);
      return null;
    }
  }
  return null;
};

const httpsOptions = getHttpsOptions();
const isHttps = !!httpsOptions;

// Initialize Fastify with HTTPS options if available
const fastify = Fastify({
  logger: true,
  https: httpsOptions || undefined
});

// Security: Configure CORS
// In production, strictly limit origin to your extension ID: `chrome-extension://<your-id>`
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigin = process.env.EXTENSION_ORIGIN || 'chrome-extension://YOUR_EXTENSION_ID';

fastify.register(cors, {
  origin: isProduction ? allowedOrigin : '*',
  methods: ['POST', 'GET']
});

// Register Routes
fastify.register(generateRoute);
fastify.register(donateRoute);

const start = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    const HOST = '0.0.0.0';
    
    await fastify.listen({ port: Number(PORT), host: HOST });
    
    const protocol = isHttps ? 'https' : 'http';
    console.log(`Server running at ${protocol}://${HOST}:${PORT}`);
    
    if (!isHttps) {
      console.warn('WARNING: Server is running in HTTP mode. For production, ensure SSL certificates are provided via SSL_KEY_PATH and SSL_CERT_PATH.');
    } else {
      console.log('Secure connection enabled (HTTPS).');
    }

  } catch (err) {
    fastify.log.error(err);
    (process as any).exit(1);
  }
};

start();
