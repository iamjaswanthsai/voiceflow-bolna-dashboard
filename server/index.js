import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/api.js';
import webhookRoutes from './routes/webhook.js';
import bolnaRoutes from './routes/bolna.js';
import { getDb } from './db/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database
getDb();
console.log('✅ Database initialized');

// API Routes
app.use('/api', apiRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/bolna', bolnaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    demo_mode: process.env.DEMO_MODE === 'true',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 VoiceFlow Server running on http://localhost:${PORT}`);
  console.log(`📡 Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/api/webhook/bolna`);
});
