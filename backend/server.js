import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import './db/index.js';

import clientAuthRoutes from './routes/clientAuth.js';
import staffAuthRoutes from './routes/staffAuth.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Flexible CORS setup
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'https://ggshcant-1.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

const distPath = path.join(__dirname, '../dist');

// ==========================================
// 1. REGISTER ALL API ROUTES FIRST
// ==========================================
app.use('/api/client-auth', clientAuthRoutes);
app.use('/api/staff-auth', staffAuthRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ==========================================
// 2. SERVE STATIC FRONTEND ASSETS
// ==========================================
app.use(express.static(distPath));

// ==========================================
// 3. SPA WILDCARD CATCH-ALL (MUST BE LAST)
// ==========================================
app.get('*', (req, res) => {
  // Prevent API requests from serving index.html if unmatched
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `API route ${req.path} not found` });
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build folder or index.html not found.');
  }
});

app.listen(PORT, () => {
  console.log(`GGSH Canteen backend running on port ${PORT}`);
});