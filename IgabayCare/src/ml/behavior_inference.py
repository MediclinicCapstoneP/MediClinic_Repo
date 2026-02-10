#!/usr/bin/env python3
"""
Behavioral Biometrics Inference Script
Real-time prediction of human vs bot behavior
"""

import sys
import json
import argparse
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Any, List

# Feature columns matching the training script
FEATURE_COLUMNS = [
    'mouseMoveCount',
    'keyPressCount', 
    'timeOnPageSeconds',
    'mouseMoveRate',
    'keyPressRate',
    'interactionBalance',
    'interactionScore',
    'idleRatio'
]

def load_model(model_path: str) -> Dict[str, Any]:
    """Load trained model and preprocessing components"""
    try:
        model_data = joblib.load(model_path)
        return model_data
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")

def prepare_features(snapshot: Dict[str, Any]) -> np.ndarray:
    """Convert snapshot to feature array"""
    features = []
    
    for feature in FEATURE_COLUMNS:
        value = snapshot.get(feature, 0)
        # Handle potential None or invalid values
        if value is None or not isinstance(value, (int, float)):
            value = 0
        features.append(float(value))
    
    return np.array(features).reshape(1, -1)

def predict_human(model_data: Dict[str, Any], snapshot: Dict[str, Any]) -> Dict[str, Any]:
    """Make prediction on behavior snapshot"""
    try:
        # Extract model components
        model = model_data['model']
        scaler = model_data['scaler']
        version = model_data.get('version', 'unknown')
        
        # Prepare features
        features = prepare_features(snapshot)
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Get confidence scores
        human_prob = probabilities[1] if len(probabilities) > 1 else 0.0
        bot_prob = probabilities[0] if len(probabilities) > 0 else 0.0
        
        is_human = bool(prediction == 1)
        confidence = max(human_prob, bot_prob)
        
        # Determine reason for decision
        reason = "Behavioral patterns match human interaction"
        if not is_human:
            # Simple heuristics for bot detection
            time_on_page = snapshot.get('timeOnPageSeconds', 0)
            mouse_rate = snapshot.get('mouseMoveRate', 0)
            key_rate = snapshot.get('keyPressRate', 0)
            idle_ratio = snapshot.get('idleRatio', 0)
            
            reasons = []
            if time_on_page < 5:
                reasons.append("very short time on page")
            if mouse_rate < 0.1 and key_rate < 0.1:
                reasons.append("minimal interaction")
            if idle_ratio > 0.7:
                reasons.append("high idle ratio")
            
            if reasons:
                reason = f"Bot indicators: {', '.join(reasons)}"
        
        result = {
            'isHuman': is_human,
            'confidence': float(confidence),
            'modelVersion': version,
            'reason': reason,
            'probabilities': {
                'human': float(human_prob),
                'bot': float(bot_prob)
            }
        }
        
        return result
        
    except Exception as e:
        # Return safe default on error
        return {
            'isHuman': False,
            'confidence': 0.0,
            'modelVersion': 'error',
            'reason': f'Prediction error: {str(e)}',
            'probabilities': {
                'human': 0.0,
                'bot': 1.0
            }
        }

def main():
    parser = argparse.ArgumentParser(description='Behavioral biometrics inference')
    parser.add_argument('--model', type=str, default='models/behavior_model.joblib', 
                       help='Path to trained model')
    
    args = parser.parse_args()
    
    try:
        # Load model
        model_data = load_model(args.model)
        
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Extract snapshot
        snapshot = input_data.get('snapshot')
        if not snapshot:
            raise ValueError("No snapshot provided in input")
        
        # Make prediction
        result = predict_human(model_data, snapshot)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'isHuman': False,
            'confidence': 0.0,
            'modelVersion': 'error',
            'reason': f'Inference failed: {str(e)}',
            'probabilities': {
                'human': 0.0,
                'bot': 1.0
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
