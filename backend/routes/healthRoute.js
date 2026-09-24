import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get('/', (req, res) => {
  const state = mongoose.connection.readyState;
  const dbUp = state === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: READY_STATES[state] || String(state),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
