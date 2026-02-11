"""
Simple API server using your trained ML model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load your trained model
try:
    model_data = joblib.load('clinic_risk_model.joblib')
    model = model_data['model']
    label_encoder = model_data['label_encoder']
    feature_columns = model_data['feature_columns']
    model_loaded = True
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model_loaded = False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded,
        'model_version': model_data.get('model_version', '1.0') if model_loaded else None,
        'timestamp': '2026-02-11T00:00:00Z'
    })

@app.route('/assess-risk', methods=['POST'])
def assess_risk():
    """Main risk assessment endpoint"""
    if not model_loaded:
        return jsonify({
            'error': 'Model not loaded',
            'message': 'Risk assessment service is currently unavailable'
        }), 503

    try:
        clinic_data = request.get_json()
        
        if not clinic_data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Clinic data is required'
            }), 400

        # Create features for prediction
        features = {
            'has_website': 1 if clinic_data.get('website') else 0,
            'has_phone': 1 if clinic_data.get('phone') else 0,
            'has_license': 1 if clinic_data.get('license_number') else 0,
            'has_accreditation': 1 if clinic_data.get('accreditation') else 0,
            'years_in_business': 2024 - clinic_data.get('year_established', 2024),
            'number_of_doctors': clinic_data.get('number_of_doctors', 1),
            'number_of_staff': clinic_data.get('number_of_staff', 0),
            'mouseMoveCount': clinic_data.get('mouseMoveCount', 0),
            'keyPressCount': clinic_data.get('keyPressCount', 0),
            'timeOnPageSeconds': clinic_data.get('timeOnPageSeconds', 0),
            'mouseMoveRate': clinic_data.get('mouseMoveRate', 0),
            'keyPressRate': clinic_data.get('keyPressRate', 0),
            'interactionBalance': clinic_data.get('interactionBalance', 0),
            'interactionScore': clinic_data.get('interactionScore', 0),
            'idleRatio': clinic_data.get('idleRatio', 0)
        }
        
        # Create DataFrame
        df = pd.DataFrame([features])
        
        # Ensure all expected columns are present
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Reorder columns
        df = df[feature_columns]
        
        # Make prediction
        prediction_encoded = model.predict(df)[0]
        prediction_proba = model.predict_proba(df)[0]
        
        risk_level = label_encoder.inverse_transform([prediction_encoded])[0]
        confidence = np.max(prediction_proba)
        
        # Calculate risk score
        risk_score = 0.5  # Base score
        if risk_level == 'HIGH':
            risk_score = 0.8 + (confidence - 0.5) * 0.4
        elif risk_level == 'MEDIUM':
            risk_score = 0.4 + (confidence - 0.5) * 0.4
        else:  # LOW
            risk_score = 0.2 + (confidence - 0.5) * 0.4
        
        risk_score = max(0.0, min(1.0, risk_score))
        
        # Recommend account status
        if risk_level == 'HIGH':
            account_status = 'RESTRICTED'
        elif risk_level == 'LOW':
            account_status = 'ACTIVE_LIMITED'
        else:
            account_status = 'VERIFICATION_REQUIRED'
        
        # Generate risk flags
        risk_flags = []
        if not clinic_data.get('website'):
            risk_flags.append('NO_WEBSITE')
        if not clinic_data.get('license_number'):
            risk_flags.append('NO_LICENSE')
        if not clinic_data.get('accreditation'):
            risk_flags.append('NO_ACCREDITATION')
        if clinic_data.get('year_established', 2024) > 2020:
            risk_flags.append('NEW_BUSINESS')
        
        result = {
            'risk_score': float(risk_score),
            'risk_level': risk_level,
            'account_status': account_status,
            'risk_flags': risk_flags,
            'confidence': float(confidence),
            'model_version': model_data.get('model_version', '1.0'),
            'prediction_timestamp': '2026-02-11T00:00:00Z',
            'api_version': '1.0',
            'request_id': f"req_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]}"
        }
        
        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    if not model_loaded:
        return jsonify({
            'error': 'Model not loaded'
        }), 503

    try:
        info = {
            'model_version': model_data.get('model_version', '1.0'),
            'feature_columns': feature_columns,
            'model_type': 'RandomForest',
            'risk_thresholds': {
                'low_risk_max': 0.3,
                'medium_risk_max': 0.7,
                'high_risk_min': 0.7
            },
            'account_statuses': ['ACTIVE_LIMITED', 'VERIFICATION_REQUIRED', 'RESTRICTED'],
            'supported_features': [
                'business_legitimacy',
                'behavioral_patterns',
                'data_completeness',
                'business_maturity'
            ]
        }
        
        return jsonify({
            'success': True,
            'data': info
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting ML Risk Assessment API...")
    print(f"Model loaded: {model_loaded}")
    app.run(host='0.0.0.0', port=5000, debug=False)
