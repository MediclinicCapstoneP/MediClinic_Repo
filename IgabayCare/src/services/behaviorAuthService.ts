import { BehaviorFeatureSnapshot } from '../types/behavior';

const API_BASE = import.meta.env.VITE_BEHAVIOR_API_BASE || 
  (import.meta.env.PROD ? '/api/behavior' : 'http://localhost:5174/api/behavior');

export interface VerificationResponse {
  isHuman: boolean;
  confidence: number;
  modelVersion?: string;
  reason?: string;
}

type SnapshotPayload = {
  snapshot: BehaviorFeatureSnapshot;
  label?: 0 | 1;
  sessionId?: string;
};

async function sendRequest<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Behavior auth API error: ${response.status}`);
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return {} as T;
}

export const behaviorAuthService = {
  async logSnapshot(payload: SnapshotPayload) {
    try {
      await sendRequest<void>('/log', payload);
    } catch (error) {
      console.warn('Telemetry logging failed', error);
    }
  },

  async verifySnapshot(snapshot: BehaviorFeatureSnapshot): Promise<VerificationResponse> {
    return sendRequest<VerificationResponse>('/verify', { snapshot });
  },

  async logFailedAttempt(snapshot: BehaviorFeatureSnapshot, details?: string) {
    try {
      await sendRequest<void>('/failed', { snapshot, details });
    } catch (error) {
      console.warn('Failed attempt logging error', error);
    }
  }
};
