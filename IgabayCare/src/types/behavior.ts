export interface BehaviorFeatureSnapshot {
  mouseMoveCount: number;
  keyPressCount: number;
  timeOnPageSeconds: number;
  mouseMoveRate: number;
  keyPressRate: number;
  interactionBalance: number;
  interactionScore: number;
  idleRatio: number;
  sessionId: string;
  captureTimestamp: string;
}
