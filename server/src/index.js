import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initDatabase } from './db/database.js';
import apiRoutes from './routes/api.js';
import { fetchInsiderTrades } from './services/insider.js';
import { fetchCongressTrades } from './services/congress.js';
import { fetch13FHoldings } from './services/sec13f.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? true  // Allow same-origin in production
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
}

// Make io available to routes
app.set('io', io);

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes in production (SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../client/dist/index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Emit new data to all connected clients
export function emitUpdate(type, data) {
  io.emit('update', { type, data, timestamp: new Date().toISOString() });
}

// Scheduled jobs for data fetching
// Fetch insider trades every 5 minutes (Form 4 filings are real-time)
cron.schedule('*/5 * * * *', async () => {
  console.log('Fetching insider trades...');
  try {
    const newTrades = await fetchInsiderTrades();
    if (newTrades.length > 0) {
      emitUpdate('insider', newTrades);
    }
  } catch (error) {
    console.error('Error fetching insider trades:', error.message);
  }
});

// Fetch congress trades every hour
cron.schedule('0 * * * *', async () => {
  console.log('Fetching congress trades...');
  try {
    const newTrades = await fetchCongressTrades();
    if (newTrades.length > 0) {
      emitUpdate('congress', newTrades);
    }
  } catch (error) {
    console.error('Error fetching congress trades:', error.message);
  }
});

// Fetch 13F holdings daily (they update quarterly but checking daily catches new filings)
cron.schedule('0 6 * * *', async () => {
  console.log('Fetching 13F holdings...');
  try {
    await fetch13FHoldings();
    emitUpdate('13f', { message: '13F holdings updated' });
  } catch (error) {
    console.error('Error fetching 13F holdings:', error.message);
  }
});

// Initial data fetch on startup
async function initialFetch() {
  console.log('Performing initial data fetch...');

  try {
    console.log('Fetching insider trades...');
    await fetchInsiderTrades();
  } catch (error) {
    console.error('Initial insider fetch error:', error.message);
  }

  try {
    console.log('Fetching congress trades...');
    await fetchCongressTrades();
  } catch (error) {
    console.error('Initial congress fetch error:', error.message);
  }

  console.log('Initial fetch complete');
}

httpServer.listen(PORT, () => {
  console.log(`NJ Trades server running on http://localhost:${PORT}`);
  // Fetch data after a short delay to let server start
  setTimeout(initialFetch, 2000);
});
