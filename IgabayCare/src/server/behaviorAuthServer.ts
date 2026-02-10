import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { BehaviorFeatureSnapshot } from '../types/behavior';
import { loadModel, predictSnapshot, PredictionResult } from '../utils/behaviorModel';

const writeFile = promisify(fs.writeFile);
const appendFile = promisify(fs.appendFile);
const CSV_PATH = path.resolve(process.cwd(), 'data', 'behavior_metrics.csv');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export class BehaviorAuthServer {
  private app = express();
  private modelLoaded = false;

  constructor(private port: number = Number(process.env.PORT || 5174)) {
    this.configureMiddleware();
    this.configureRoutes();
  }

  private configureMiddleware() {
    this.app.use(express.json());
    this.app.use(cors());
    this.app.use(helmet());

    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/behavior', limiter);
  }

  private configureRoutes() {
    this.app.get('/api/behavior/health', (_req, res) => {
      res.json({ status: 'ok', modelLoaded: this.modelLoaded });
    });

    this.app.post('/api/behavior/log', async (req: Request, res: Response) => {
      try {
        const { snapshot, sessionId, label, labelSource = 'auto' }: { snapshot: BehaviorFeatureSnapshot; sessionId?: string; label?: 0 | 1; labelSource?: string } = req.body;
        if (!snapshot) {
          return res.status(400).json({ error: 'snapshot required' });
        }

        await this.ensureCsvStructure();
        await this.appendSnapshot(snapshot, label, labelSource);

        if (supabase && sessionId) {
          await supabase.from('behavior_metrics').insert({
            session_id: sessionId,
            features: snapshot,
            label,
            label_source: labelSource,
            captured_at: snapshot.captureTimestamp,
          });
        }

        res.status(204).send();
      } catch (error) {
        console.error('log error', error);
        res.status(500).json({ error: 'failed to log snapshot' });
      }
    });

    this.app.post('/api/behavior/failed', async (req: Request, res: Response) => {
      try {
        const { snapshot, details }: { snapshot: BehaviorFeatureSnapshot; details?: string } = req.body;
        if (!snapshot) {
          return res.status(400).json({ error: 'snapshot required' });
        }

        if (supabase) {
          await supabase.from('behavior_failed_attempts').insert({
            snapshot,
            reason: details,
            captured_at: snapshot.captureTimestamp,
          });
        }

        res.status(204).send();
      } catch (error) {
        console.error('failed attempt log error', error);
        res.status(500).json({ error: 'failed to log attempt' });
      }
    });

    this.app.post('/api/behavior/verify', async (req: Request, res: Response) => {
      try {
        const { snapshot }: { snapshot: BehaviorFeatureSnapshot } = req.body;
        if (!snapshot) {
          return res.status(400).json({ error: 'snapshot required' });
        }

        const model = await loadModel();
        this.modelLoaded = true;
        const result: PredictionResult = await predictSnapshot(model, snapshot);

        res.json(result);
      } catch (error) {
        console.error('verification error', error);
        res.status(500).json({ error: 'verification failed' });
      }
    });
  }

  private async ensureCsvStructure() {
    const headers = 'mouseMoveCount,keyPressCount,timeOnPageSeconds,mouseMoveRate,keyPressRate,interactionBalance,interactionScore,idleRatio,sessionId,captureTimestamp,label,labelSource\n';
    try {
      await fs.promises.access(CSV_PATH, fs.constants.F_OK);
    } catch {
      await fs.promises.mkdir(path.dirname(CSV_PATH), { recursive: true });
      await writeFile(CSV_PATH, headers, 'utf8');
    }
  }

  private async appendSnapshot(snapshot: BehaviorFeatureSnapshot, label?: number, labelSource?: string) {
    const row = [
      snapshot.mouseMoveCount,
      snapshot.keyPressCount,
      snapshot.timeOnPageSeconds,
      snapshot.mouseMoveRate,
      snapshot.keyPressRate,
      snapshot.interactionBalance,
      snapshot.interactionScore,
      snapshot.idleRatio,
      snapshot.sessionId,
      snapshot.captureTimestamp,
      label ?? '',
      labelSource ?? 'auto'
    ].join(',');

    await appendFile(CSV_PATH, `\n${row}`);
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Behavior auth server listening on port ${this.port}`);
    });
  }
}

if (require.main === module) {
  const server = new BehaviorAuthServer();
  server.start();
}
