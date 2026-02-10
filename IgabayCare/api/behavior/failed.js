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
  max: 20, // 20 failed attempt logs per minute
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
    const { snapshot, details } = req.body;
    
    if (!snapshot) {
      return res.status(400).json({ error: 'snapshot required' });
    }
    
    console.log('Failed attempt logged:', { 
      sessionId: snapshot.sessionId,
      reason: details?.reason || 'Unknown',
      confidence: details?.confidence || 0,
      timestamp: new Date().toISOString()
    });
    
    // In production, this would save to:
    // 1. Supabase behavior_failed_attempts table
    // 2. Security monitoring service
    // 3. Alert system for suspicious activity
    
    // Log suspicious patterns
    if (snapshot.timeOnPageSeconds < 3) {
      console.warn('⚠️ Suspicious: Very fast submission detected');
    }
    
    if (snapshot.interactionScore < 0.05) {
      console.warn('⚠️ Suspicious: No meaningful interaction detected');
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Failed attempt logging error:', error);
    res.status(500).json({ error: 'Failed to log attempt' });
  }
}
