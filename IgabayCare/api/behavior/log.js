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
  max: 100, // 100 log requests per minute
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
    const { snapshot, sessionId, label, labelSource = 'auto' } = req.body;
    
    if (!snapshot) {
      return res.status(400).json({ error: 'snapshot required' });
    }
    
    console.log('Logging snapshot:', { 
      sessionId, 
      label, 
      labelSource,
      timestamp: new Date().toISOString()
    });
    
    // In production, this would save to:
    // 1. Supabase database
    // 2. CSV file for training
    // 3. Analytics service
    
    // For now, just log to Vercel logs
    console.log('Behavior data:', {
      mouseMoveCount: snapshot.mouseMoveCount,
      keyPressCount: snapshot.keyPressCount,
      timeOnPageSeconds: snapshot.timeOnPageSeconds,
      interactionScore: snapshot.interactionScore,
      idleRatio: snapshot.idleRatio
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Log error:', error);
    res.status(500).json({ error: 'Failed to log snapshot' });
  }
}
