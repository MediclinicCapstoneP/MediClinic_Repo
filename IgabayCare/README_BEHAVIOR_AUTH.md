# Behavioral Biometrics Authentication System

This guide walks through the complete setup and testing of the behavioral biometrics authentication system for booking requests.

## Overview

The system distinguishes between human users and automated bots by analyzing behavioral patterns during the booking process:
- Mouse movement patterns
- Keyboard activity
- Time spent on page
- Interaction rates and balance
- Idle periods

## Quick Start

### 1. Database Setup

Run the database schema to create the necessary tables:

```sql
-- Run this in your Supabase SQL editor
-- File: database/behavior_metrics_schema.sql
```

### 2. Backend Setup

Install dependencies and start the behavior auth server:

```bash
# Install backend dependencies
npm install express cors helmet express-rate-limit @types/express @types/cors

# Start the behavior auth server
node src/server/behaviorAuthServer.ts
```

The server will start on port 5174 by default.

### 3. Frontend Integration

The behavioral authentication is already integrated into the `EnhancedAppointmentBookingModal` component. The system:

1. **Collects telemetry** when the booking modal opens
2. **Logs snapshots** every 15 seconds
3. **Verifies behavior** before allowing booking submission
4. **Blocks bots** with user-friendly messages
5. **Logs failed attempts** for security analysis

### 4. Testing the System

#### Test Human Behavior
1. Open the appointment booking modal
2. Spend at least 30 seconds interacting (moving mouse, typing)
3. Fill out the form normally
4. Submit the booking - should succeed

#### Test Bot Behavior
1. Open the appointment booking modal
2. Submit immediately without interaction
3. Should be blocked with "We could not verify that this booking request was made by a real person"

## Model Training (Optional)

For production deployment, you'll want to train a proper ML model:

### Prerequisites
- Python 3.8+
- pip package manager

### Training Steps

```bash
# Install Python dependencies
pip install -r requirements.txt

# Generate sample training data
python src/ml/behavior_training.py --generate-sample data/behavior_metrics.csv --sample-size 2000

# Train the model
python src/ml/behavior_training.py --data data/behavior_metrics.csv --output models/behavior_model.joblib
```

### Using Real Data

1. Collect behavioral data from real users (labeled as human)
2. Collect bot data (labeled as bot)
3. Combine into a CSV file
4. Train the model using the script above

## Configuration

### Environment Variables

```bash
# Backend server
PORT=5174
BEHAVIOR_MODEL_PATH=models/behavior_model.joblib
BEHAVIOR_PYTHON_BIN=python
BEHAVIOR_INFERENCE_SCRIPT=src/ml/mock_inference.py

# Frontend
VITE_BEHAVIOR_API_BASE=http://localhost:5174/api/behavior
```

### Supabase Setup

Ensure your Supabase instance has the service role key available for the backend server:

```bash
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoints

### POST /api/behavior/log
Logs behavioral snapshots for training data.

**Request:**
```json
{
  "snapshot": {
    "mouseMoveCount": 156,
    "keyPressCount": 42,
    "timeOnPageSeconds": 127.3,
    "mouseMoveRate": 1.225,
    "keyPressRate": 0.33,
    "interactionBalance": 0.576,
    "interactionScore": 0.779,
    "idleRatio": 0.234,
    "sessionId": "booking-123",
    "captureTimestamp": "2026-02-10T05:20:00.000Z"
  },
  "sessionId": "booking-123",
  "label": 1
}
```

### POST /api/behavior/verify
Verifies if a snapshot represents human behavior.

**Request:**
```json
{
  "snapshot": {
    "mouseMoveCount": 156,
    "keyPressCount": 42,
    "timeOnPageSeconds": 127.3,
    "mouseMoveRate": 1.225,
    "keyPressRate": 0.33,
    "interactionBalance": 0.576,
    "interactionScore": 0.779,
    "idleRatio": 0.234,
    "sessionId": "booking-123",
    "captureTimestamp": "2026-02-10T05:20:00.000Z"
  }
}
```

**Response:**
```json
{
  "isHuman": true,
  "confidence": 0.85,
  "modelVersion": "1.0.0",
  "reason": "Human indicators: reasonable time on page, active interaction",
  "probabilities": {
    "human": 0.85,
    "bot": 0.15
  }
}
```

### POST /api/behavior/failed
Logs failed authentication attempts.

**Request:**
```json
{
  "snapshot": {...},
  "details": "Bot indicators: very short time on page, minimal interaction"
}
```

## Security Considerations

1. **No PII Collection**: The system only collects behavioral metrics, no personal information
2. **Session-based IDs**: Uses random session identifiers that don't link to user accounts
3. **Data Retention**: Automatic cleanup of old data (90 days for metrics, 30 days for failed attempts)
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Deployment to Orange Pi

For production deployment on Orange Pi:

1. **Install Dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip nodejs npm
   ```

2. **Setup Python Environment**:
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Setup Node.js Environment**:
   ```bash
   npm install
   ```

4. **Configure Environment**:
   ```bash
   export PORT=5174
   export BEHAVIOR_MODEL_PATH=/path/to/models/behavior_model.joblib
   ```

5. **Run as Service**:
   ```bash
   # Create systemd service file
   sudo nano /etc/systemd/system/behavior-auth.service
   ```

   ```ini
   [Unit]
   Description=Behavioral Authentication Service
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/path/to/IgabayCare
   ExecStart=/usr/bin/node src/server/behaviorAuthServer.ts
   Restart=always
   Environment=PORT=5174

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable behavior-auth
   sudo systemctl start behavior-auth
   ```

## Monitoring and Maintenance

### Check Server Status
```bash
curl http://localhost:5174/api/behavior/health
```

### View Logs
```bash
journalctl -u behavior-auth -f
```

### Monitor Model Performance
The system automatically logs model performance metrics to the `behavior_model_metrics` table.

### Data Cleanup
Automatic cleanup runs via the `cleanup_old_behavior_data()` function. For manual cleanup:

```sql
SELECT cleanup_old_behavior_data();
```

## Troubleshooting

### Common Issues

1. **Python not found**: Ensure Python is installed and accessible
2. **Model loading fails**: Check model file path and Python dependencies
3. **Database connection issues**: Verify Supabase credentials and network access
4. **TypeScript errors**: Run `npm install` to ensure all dependencies are installed

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=behavior-auth node src/server/behaviorAuthServer.ts
```

## Next Steps

1. **Collect Real Data**: Gather behavioral data from actual users
2. **Train Production Model**: Use real data to train an accurate model
3. **Fine-tune Thresholds**: Adjust confidence thresholds based on your requirements
4. **Monitor Performance**: Track false positives/negatives and adjust accordingly
5. **Add More Features**: Consider additional behavioral metrics like scroll patterns, click timing, etc.
