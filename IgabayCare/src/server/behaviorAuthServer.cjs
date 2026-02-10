const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5174;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/behavior', limiter);

// Health check
app.get('/api/behavior/health', (req, res) => {
  res.json({ status: 'ok', modelLoaded: false });
});

// Log snapshot
app.post('/api/behavior/log', async (req, res) => {
  try {
    const { snapshot, sessionId, label, labelSource = 'auto' } = req.body;
    if (!snapshot) {
      return res.status(400).json({ error: 'snapshot required' });
    }
    
    console.log('Logging snapshot:', { sessionId, label, labelSource });
    
    // For now, just log to console
    // In production, this would save to database/CSV
    
    res.status(204).send();
  } catch (error) {
    console.error('log error', error);
    res.status(500).json({ error: 'failed to log snapshot' });
  }
});

// Verify snapshot (mock implementation)
app.post('/api/behavior/verify', async (req, res) => {
  try {
    const { snapshot } = req.body;
    if (!snapshot) {
      return res.status(400).json({ error: 'snapshot required' });
    }
    
    console.log('Verifying snapshot:', snapshot.sessionId);
    
    // Simple mock verification
    const timeOnPage = snapshot.timeOnPageSeconds || 0;
    const interactionScore = snapshot.interactionScore || 0;
    const idleRatio = snapshot.idleRatio || 0;
    
    let isHuman = true;
    let confidence = 0.5;
    let reason = 'Normal behavior patterns';
    
    // Simple heuristics
    if (timeOnPage < 5) {
      isHuman = false;
      confidence += 0.3;
      reason = 'Very short time on page';
    }
    
    if (interactionScore < 0.1) {
      isHuman = false;
      confidence += 0.2;
      reason += ', Low interaction score';
    }
    
    if (idleRatio > 0.7) {
      isHuman = false;
      confidence += 0.2;
      reason += ', High idle ratio';
    }
    
    confidence = Math.min(1, Math.max(0, confidence));
    
    const result = {
      isHuman,
      confidence,
      modelVersion: 'mock-1.0.0',
      reason,
      probabilities: {
        human: isHuman ? confidence : 0.1,
        bot: isHuman ? 0.1 : confidence
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('verification error', error);
    res.status(500).json({ error: 'verification failed' });
  }
});

// Log failed attempt
app.post('/api/behavior/failed', async (req, res) => {
  try {
    const { snapshot, details } = req.body;
    if (!snapshot) {
      return res.status(400).json({ error: 'snapshot required' });
    }
    
    console.log('Failed attempt:', { sessionId: snapshot.sessionId, details });
    
    res.status(204).send();
  } catch (error) {
    console.error('failed attempt logging error', error);
    res.status(500).json({ error: 'failed to log attempt' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Behavior auth server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/behavior/health`);
});
