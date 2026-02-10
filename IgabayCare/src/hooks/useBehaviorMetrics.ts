import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BehaviorFeatureSnapshot } from '../types/behavior';

export interface BehaviorMetricsConfig {
  sessionId?: string;
  throttleIntervalMs?: number;
  onSnapshot?: (snapshot: BehaviorFeatureSnapshot) => void;
  enabled?: boolean;
}

const DEFAULT_THROTTLE = 75;

/**
 * Captures lightweight behavioral biometrics for the current view without storing sensitive data.
 */
export const useBehaviorMetrics = (config: BehaviorMetricsConfig = {}) => {
  const { sessionId, throttleIntervalMs = DEFAULT_THROTTLE, onSnapshot, enabled = true } = config;

  const [mouseMoveCount, setMouseMoveCount] = useState(0);
  const [keyPressCount, setKeyPressCount] = useState(0);
  const activityTimestamps = useRef<number[]>([]);
  const mouseMoveCountRef = useRef(0);
  const keyPressCountRef = useRef(0);
  const startTimestamp = useRef<number>(Date.now());
  const lastMouseEvent = useRef<number>(0);

  const resetMetrics = useCallback(() => {
    setMouseMoveCount(0);
    setKeyPressCount(0);
    mouseMoveCountRef.current = 0;
    keyPressCountRef.current = 0;
    activityTimestamps.current = [];
    startTimestamp.current = Date.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    startTimestamp.current = Date.now();

    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseEvent.current < throttleIntervalMs) return;
      lastMouseEvent.current = now;

      setMouseMoveCount(prev => {
        const next = prev + 1;
        mouseMoveCountRef.current = next;
        return next;
      });
      activityTimestamps.current.push(now);
    };

    const handleKeyDown = () => {
      const now = Date.now();
      setKeyPressCount(prev => {
        const next = prev + 1;
        keyPressCountRef.current = next;
        return next;
      });
      activityTimestamps.current.push(now);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, throttleIntervalMs]);

  useEffect(() => {
    if (!enabled) {
      resetMetrics();
    }
  }, [enabled, resetMetrics]);

  const computeSnapshot = useCallback((): BehaviorFeatureSnapshot => {
    const now = Date.now();
    const elapsedMs = Math.max(now - startTimestamp.current, 1);
    const elapsedSeconds = elapsedMs / 1000;

    const mmCount = mouseMoveCountRef.current;
    const kpCount = keyPressCountRef.current;

    const mmRate = mmCount / elapsedSeconds;
    const kpRate = kpCount / elapsedSeconds;

    const totalActivity = mmCount + kpCount;
    const balance = totalActivity === 0 ? 0 : Math.abs(mmCount - kpCount) / totalActivity;

    const idleWindows = activityTimestamps.current
      .slice(-15)
      .reduce((idleCount, timestamp, index, arr) => {
        if (index === 0) return idleCount;
        const deltaSeconds = (timestamp - arr[index - 1]) / 1000;
        return deltaSeconds > 10 ? idleCount + 1 : idleCount;
      }, 0);

    const idleRatio = activityTimestamps.current.length === 0
      ? 1
      : idleWindows / activityTimestamps.current.length;

    const interactionScore = Math.min(1, (mmRate + kpRate) / 20);

    const snapshot: BehaviorFeatureSnapshot = {
      mouseMoveCount: mmCount,
      keyPressCount: kpCount,
      timeOnPageSeconds: parseFloat(elapsedSeconds.toFixed(2)),
      mouseMoveRate: parseFloat(mmRate.toFixed(3)),
      keyPressRate: parseFloat(kpRate.toFixed(3)),
      interactionBalance: parseFloat(balance.toFixed(3)),
      interactionScore: parseFloat(interactionScore.toFixed(3)),
      idleRatio: parseFloat(idleRatio.toFixed(3)),
      sessionId: sessionId || `booking-${startTimestamp.current}`,
      captureTimestamp: new Date(now).toISOString(),
    };

    if (onSnapshot) {
      onSnapshot(snapshot);
    }

    return snapshot;
  }, [onSnapshot, sessionId]);

  const metrics = useMemo(
    () => ({
      mouseMoveCount,
      keyPressCount,
      getSnapshot: computeSnapshot,
      reset: resetMetrics,
    }),
    [computeSnapshot, keyPressCount, mouseMoveCount, resetMetrics]
  );

  return metrics;
};
