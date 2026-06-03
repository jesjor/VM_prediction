import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/index.js';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import participantRoutes from './routes/participants.js';
import squadRoutes from './routes/squads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/squads', squadRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    }
  });
}

// Start server immediately so healthcheck responds right away
app.listen(PORT, () => console.log(`🚀 VM2026 lytter på port ${PORT}`));

// Then init database in background
initDb()
  .then(() => console.log('✅ Database klar'))
  .catch(err => {
    console.error('❌ Database fejl:', err);
    // Don't exit — let Railway see the healthcheck pass first
    // The app will retry DB connections on each request
  });
