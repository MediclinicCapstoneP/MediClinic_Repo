import cors from 'cors';
import rateLimit from 'express-rate-limit';

// CORS middleware
const corsMiddleware = cors({
  origin: ['https://your-vercel-domain.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 verification requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

export default async function handler(req, res) {
  // Apply CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { snapshot } = req.body;
    
    if (!snapshot) {
      return res.status(400).json({ error: 'snapshot required' });
    }

    console.log('Verifying snapshot:', snapshot.sessionId);
    
    // Mock verification logic (same as local server)
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
      modelVersion: 'vercel-mock-1.0.0',
      reason,
      probabilities: {
        human: isHuman ? confidence : 0.1,
        bot: isHuman ? 0.1 : confidence
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}
