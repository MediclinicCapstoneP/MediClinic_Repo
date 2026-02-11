"""
Test API for your trained ML model
"""

import joblib
import pandas as pd
import numpy as np

def test_model():
    print("=== Testing Your Trained ML Model ===")
    
    # Load the trained model
    try:
        model_data = joblib.load('clinic_risk_model.joblib')
        model = model_data['model']
        label_encoder = model_data['label_encoder']
        feature_columns = model_data['feature_columns']
        
        print("Model loaded successfully!")
        print(f"Model version: {model_data.get('model_version', 'Unknown')}")
        print(f"Features: {len(feature_columns)}")
        
    except Exception as e:
        print(f"Error loading model: {e}")
        return
    
    # Test cases
    test_cases = [
        {
            'name': 'Low Risk Clinic',
            'data': {
                'clinic_name': 'Established Medical Center',
                'website': 'https://established.com',
                'license_number': 'LIC-123456',
                'accreditation': 'ACC-789',
                'year_established': 2005,
                'number_of_doctors': 8,
                'mouseMoveCount': 200,
                'keyPressCount': 80,
                'timeOnPageSeconds': 300,
                'mouseMoveRate': 0.9,
                'keyPressRate': 0.4,
                'interactionBalance': 0.8,
                'interactionScore': 0.9,
                'idleRatio': 0.1
            }
        },
        {
            'name': 'High Risk Clinic',
            'data': {
                'clinic_name': 'New Clinic',
                'website': '',
                'license_number': '',
                'accreditation': '',
                'year_established': 2023,
                'number_of_doctors': 1,
                'mouseMoveCount': 50,
                'keyPressCount': 10,
                'timeOnPageSeconds': 60,
                'mouseMoveRate': 0.3,
                'keyPressRate': 0.1,
                'interactionBalance': 0.2,
                'interactionScore': 0.2,
                'idleRatio': 0.8
            }
        }
    ]
    
    print("\n=== Test Results ===")
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        print("-" * 40)
        
        # Create features
        features = {
            'has_website': 1 if test_case['data'].get('website') else 0,
            'has_phone': 1 if test_case['data'].get('phone') else 0,
            'has_license': 1 if test_case['data'].get('license_number') else 0,
            'has_accreditation': 1 if test_case['data'].get('accreditation') else 0,
            'years_in_business': 2024 - test_case['data'].get('year_established', 2024),
            'number_of_doctors': test_case['data'].get('number_of_doctors', 1),
            'number_of_staff': test_case['data'].get('number_of_staff', 0),
            'mouseMoveCount': test_case['data'].get('mouseMoveCount', 0),
            'keyPressCount': test_case['data'].get('keyPressCount', 0),
            'timeOnPageSeconds': test_case['data'].get('timeOnPageSeconds', 0),
            'mouseMoveRate': test_case['data'].get('mouseMoveRate', 0),
            'keyPressRate': test_case['data'].get('keyPressRate', 0),
            'interactionBalance': test_case['data'].get('interactionBalance', 0),
            'interactionScore': test_case['data'].get('interactionScore', 0),
            'idleRatio': test_case['data'].get('idleRatio', 0)
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
        
        print(f"Risk Level: {risk_level}")
        print(f"Confidence: {confidence:.3f}")
        print(f"Probabilities:")
        for class_name, prob in zip(label_encoder.classes_, prediction_proba):
            print(f"  {class_name}: {prob:.3f}")
        
        # Determine account status
        if risk_level == 'HIGH':
            account_status = 'RESTRICTED'
        elif risk_level == 'LOW':
            account_status = 'ACTIVE_LIMITED'
        else:
            account_status = 'VERIFICATION_REQUIRED'
        
        print(f"Recommended Account Status: {account_status}")

if __name__ == "__main__":
    test_model()
