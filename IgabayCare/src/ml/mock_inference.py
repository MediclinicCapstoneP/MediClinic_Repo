#!/usr/bin/env python3
"""
Mock inference script for behavioral biometrics
Provides simple rule-based classification when no trained model is available
"""

import sys
import json
from typing import Dict, Any

def predict_human_mock(snapshot: Dict[str, Any]) -> Dict[str, Any]:
    """Simple rule-based human/bot detection"""
    
    # Extract features
    time_on_page = snapshot.get('timeOnPageSeconds', 0)
    mouse_rate = snapshot.get('mouseMoveRate', 0)
    key_rate = snapshot.get('keyPressRate', 0)
    idle_ratio = snapshot.get('idleRatio', 0)
    interaction_score = snapshot.get('interactionScore', 0)
    
    # Simple heuristics for bot detection
    bot_indicators = []
    confidence = 0.5
    
    # Very short time on page suggests bot
    if time_on_page < 5:
        bot_indicators.append("very short time on page")
        confidence += 0.3
    
    # Minimal interaction suggests bot
    if mouse_rate < 0.1 and key_rate < 0.1:
        bot_indicators.append("minimal interaction")
        confidence += 0.2
    
    # High idle ratio suggests bot
    if idle_ratio > 0.7:
        bot_indicators.append("high idle ratio")
        confidence += 0.2
    
    # Low interaction score suggests bot
    if interaction_score < 0.1:
        bot_indicators.append("low interaction score")
        confidence += 0.1
    
    # Human indicators
    human_indicators = []
    
    if time_on_page > 30 and time_on_page < 300:
        human_indicators.append("reasonable time on page")
        confidence -= 0.2
    
    if mouse_rate > 0.5 and key_rate > 0.1:
        human_indicators.append("active interaction")
        confidence -= 0.2
    
    if idle_ratio < 0.5:
        human_indicators.append("low idle ratio")
        confidence -= 0.1
    
    # Determine final prediction
    is_human = confidence < 0.6
    final_confidence = abs(confidence - 0.5) * 2  # Scale to 0-1
    
    # Generate reason
    if is_human:
        reason = f"Human indicators: {', '.join(human_indicators) if human_indicators else 'normal behavior patterns'}"
    else:
        reason = f"Bot indicators: {', '.join(bot_indicators) if bot_indicators else 'suspicious behavior patterns'}"
    
    result = {
        'isHuman': is_human,
        'confidence': min(1.0, max(0.0, final_confidence)),
        'modelVersion': 'mock-1.0.0',
        'reason': reason,
        'probabilities': {
            'human': 1 - final_confidence if is_human else 0.1,
            'bot': final_confidence if not is_human else 0.1
        }
    }
    
    return result

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Extract snapshot
        snapshot = input_data.get('snapshot')
        if not snapshot:
            raise ValueError("No snapshot provided in input")
        
        # Make prediction
        result = predict_human_mock(snapshot)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'isHuman': False,
            'confidence': 0.0,
            'modelVersion': 'mock-error',
            'reason': f'Mock inference failed: {str(e)}',
            'probabilities': {
                'human': 0.0,
                'bot': 1.0
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
