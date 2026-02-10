# Behavioral Biometrics Human Authentication System

## Concept Overview

Behavioral biometrics verify whether a user is human by monitoring unconscious interaction patterns (mouse, keyboard, timing). Unlike CAPTCHA, these signals are difficult for bots to replicate and incur low friction for real users. The system collects motion-based telemetry, transforms it into features, and feeds a lightweight ML classifier that distinguishes human from automated behavior.

## Architecture

```
┌──────────────┐      ┌────────────────────────────┐      ┌─────────────────────┐      ┌────────────────────┐
│ Booking UI   │      │ Client Telemetry Collector │      │ Event Ingestion API │      │ Feature Store /    │
│ (React)      │◄────►│ useBehaviorMetrics hook    │─────►│ /api/behavior/log    │─────►│ CSV + DB           │
└──────┬───────┘      └────────────┬──────────────┘      └───────────┬─────────┘      └─────┬──────────────┘
       │                           │                                 │                     │
       │                 Snapshot JSON (mouse/keyboard/timing)       │                     │
       ▼                           │                                 │                     │
┌─────────────────────┐           │                                 ▼                     │
│ Booking Workflow     │◄─────────┴──────────┐        ┌─────────────────────────┐         │
│ (EnhancedBooking)   │ Human gate decision  │        │ ML Training Pipeline    │         │
│                     │ (API inference call) │◄──────►│ (Python + scikit-learn) │◄────────┘
└────────┬────────────┘                     │        └────────┬────────────────┘
         │                                    Export model   │
         │ Prediction + reason codes          (.joblib)      ▼
         │                                                 ┌────────────────────┐
         └────────────────────────────────────────────────►│ Inference Service │
                                                           │ (Express + joblib)│
                                                           └────────────────────┘
```

## Workflow

1. **Telemetry capture** – `useBehaviorMetrics` hook observes mouse move frequency, keyboard activity, and dwell time. Short-lived snapshots keep data non-sensitive.
2. **Booking flow instrumentation** – When the booking form opens and before submission, the UI requests a metrics snapshot. The snapshot is sent to `/api/behavior/log` for persistence and `/api/behavior/verify` for inference.
3. **Feature storage** – Data is appended to `behavior_metrics.csv` for offline model training and optionally stored in `behavior_metrics` table (sessionId, counts, rates, timestamp, label?). No PII is transmitted (session IDs, not names/emails).
4. **Model training** – Python pipeline loads CSV, encodes features, splits train/test, trains Decision Tree or Random Forest, evaluates accuracy, saves `behavior_model.joblib`.
5. **Deployment target** – The model artifact is copied to an Orange Pi (ARM64) with Python3.8+, scikit-learn runtime. Inference script loads joblib once and exposes REST API via FastAPI/Flask.
6. **Runtime inference** – The booking API calls inference endpoint with latest feature snapshot. If classified as bot (0), booking workflow halts, returning user-friendly error and logging attempt.
7. **Monitoring** – Failed authentications logged in `behavior_failed_log` table with timestamp, sessionId, features, predicted label, probability, optional manual review reason.

## Security & Privacy Considerations

- No personal identifiers collected; telemetry limited to counts and rates.
- Session IDs generated per booking attempt to avoid user tracking across sessions.
- HTTPS enforced for all network calls.
- Model service rate-limited to prevent automated probing.
- Telemetry data retained for 30 days; aggregated metrics stored longer for model refresh.
- Orange Pi deployment uses read-only filesystem for model file. Inference service runs as non-root user, behind firewall/VPN.
- Logs scrubbed of PII and rotated regularly.

## Presentation Talking Points

- Highlight passive nature vs CAPTCHAs.
- Mention iterative model improvement via labelled data.
- Emphasize privacy-first approach (only behavior signals).
- Discuss lightweight deployment enabling edge inference.
- Outline resilience measures: fallback to manual verification if service unreachable.
