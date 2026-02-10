import { spawn } from 'child_process';
import path from 'path';
import { BehaviorFeatureSnapshot } from '../types/behavior';

export interface LoadedModel {
  modelPath: string;
  pythonExecutable: string;
}

export interface PredictionResult {
  isHuman: boolean;
  confidence: number;
  modelVersion?: string;
  reason?: string;
}

const MODEL_PATH = process.env.BEHAVIOR_MODEL_PATH || path.resolve(process.cwd(), 'models', 'behavior_model.joblib');
const PYTHON_BIN = process.env.BEHAVIOR_PYTHON_BIN || 'python';
const INFERENCE_SCRIPT = process.env.BEHAVIOR_INFERENCE_SCRIPT || path.resolve(process.cwd(), 'src', 'ml', 'mock_inference.py');

let cachedModel: LoadedModel | null = null;

export async function loadModel(): Promise<LoadedModel> {
  if (cachedModel) {
    return cachedModel;
  }

  cachedModel = {
    modelPath: MODEL_PATH,
    pythonExecutable: PYTHON_BIN,
  };

  return cachedModel;
}

export async function predictSnapshot(model: LoadedModel, snapshot: BehaviorFeatureSnapshot): Promise<PredictionResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(model.pythonExecutable, [INFERENCE_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const payload = JSON.stringify({ snapshot, model_path: model.modelPath });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (error) => {
      reject(error);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Inference script exited with code ${code}`));
      }

      try {
        const parsed: PredictionResult = JSON.parse(stdout);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });

    proc.stdin.write(payload);
    proc.stdin.end();
  });
}
