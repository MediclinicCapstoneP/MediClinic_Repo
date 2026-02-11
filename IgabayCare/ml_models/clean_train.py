"""
Clean training script without emojis for Windows compatibility
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os

def main():
    print("=== ML Training with Your Behavioral Data ===")
    
    # Check if behavioral data exists
    if not os.path.exists('../data/behavior_metrics.csv'):
        print("ERROR: behavioral_metrics.csv not found")
        return
    
    # Load behavioral data
    print("Loading behavioral metrics...")
    behavior_df = pd.read_csv('../data/behavior_metrics.csv')
    print(f"Loaded {len(behavior_df)} records")
    
    # Create comprehensive training data
    print("Creating clinic data...")
    np.random.seed(42)
    n_records = len(behavior_df)
    
    # Create clinic data with behavioral metrics
    clinic_data = {
        'clinic_id': [f'clinic_{i:04d}' for i in range(n_records)],
        'clinic_name': [f'Medical Center {i}' for i in range(n_records)],
        'website': [f'https://clinic{i}.com' if np.random.random() > 0.3 else '' for i in range(n_records)],
        'phone': [f'+1-555-{i:04d}-{np.random.randint(1000, 9999)}' for i in range(n_records)],
        'email': [f'clinic{i}@healthcare.com' for i in range(n_records)],
        'license_number': [f'LIC-{i:06d}' if np.random.random() > 0.2 else '' for i in range(n_records)],
        'accreditation': [f'ACC-{i}' if np.random.random() > 0.4 else '' for i in range(n_records)],
        'year_established': np.random.randint(1990, 2024, n_records),
        'number_of_doctors': np.random.randint(1, 15, n_records),
        'number_of_staff': np.random.randint(0, 30, n_records),
        'address': [f'{i} Healthcare Ave' for i in range(n_records)],
        'city': [f'Medical City {i % 50}' for i in range(n_records)],
        'state': [f'Health State {i % 25}' for i in range(n_records)],
        'zip_code': [f'{i:05d}' for i in range(n_records)],
        'description': [f'Comprehensive medical facility {i} providing quality healthcare services.' for i in range(n_records)],
        
        # Behavioral metrics from your data
        'mouseMoveCount': behavior_df['mouseMoveCount'].values,
        'keyPressCount': behavior_df['keyPressCount'].values,
        'timeOnPageSeconds': behavior_df['timeOnPageSeconds'].values,
        'mouseMoveRate': behavior_df['mouseMoveRate'].values,
        'keyPressRate': behavior_df['keyPressRate'].values,
        'interactionBalance': behavior_df['interactionBalance'].values,
        'interactionScore': behavior_df['interactionScore'].values,
        'idleRatio': behavior_df['idleRatio'].values,
        'behavioral_label': behavior_df['label'].values
    }
    
    df = pd.DataFrame(clinic_data)
    
    # Create features
    print("Engineering features...")
    features = pd.DataFrame()
    
    # Basic features
    features['has_website'] = df['website'].notna().astype(int)
    features['has_phone'] = df['phone'].notna().astype(int)
    features['has_license'] = df['license_number'].notna().astype(int)
    features['has_accreditation'] = df['accreditation'].notna().astype(int)
    features['years_in_business'] = 2024 - df['year_established']
    features['number_of_doctors'] = df['number_of_doctors']
    features['number_of_staff'] = df['number_of_staff']
    
    # Behavioral features
    features['mouseMoveCount'] = df['mouseMoveCount']
    features['keyPressCount'] = df['keyPressCount']
    features['timeOnPageSeconds'] = df['timeOnPageSeconds']
    features['mouseMoveRate'] = df['mouseMoveRate']
    features['keyPressRate'] = df['keyPressRate']
    features['interactionBalance'] = df['interactionBalance']
    features['interactionScore'] = df['interactionScore']
    features['idleRatio'] = df['idleRatio']
    
    # Create risk scores based on behavioral patterns
    print("Creating risk labels...")
    risk_scores = []
    
    for i, row in df.iterrows():
        score = 0.5  # Base score
        
        # Behavioral risk factors
        if row['idleRatio'] > 0.5:  # High idle time
            score += 0.1
        if row['interactionScore'] < 0.3:  # Low interaction
            score += 0.15
        if row['mouseMoveRate'] < 0.5:  # Low mouse activity
            score += 0.1
        
        # Behavioral protective factors
        if row['interactionScore'] > 0.7:  # High interaction
            score -= 0.15
        if row['timeOnPageSeconds'] > 120:  # Good time spent
            score -= 0.1
        
        # Business legitimacy factors
        if not row['license_number']:
            score += 0.2
        if not row['accreditation']:
            score += 0.1
        if not row['website']:
            score += 0.1
        
        # Business maturity factors
        if row['year_established'] > 2018:  # New business
            score += 0.15
        elif row['year_established'] < 2010:  # Established
            score -= 0.1
        
        risk_scores.append(max(0.0, min(1.0, score)))
    
    df['risk_score'] = risk_scores
    
    # Create risk levels
    df['risk_level'] = df['risk_score'].apply(
        lambda x: 'LOW' if x <= 0.3 else ('MEDIUM' if x <= 0.7 else 'HIGH')
    )
    
    print(f"Risk distribution:")
    print(df['risk_level'].value_counts())
    
    # Prepare training data
    X = features.fillna(0)
    y = df['risk_level']
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Split data (without stratification due to class imbalance)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train model
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    
    print(f"Training accuracy: {train_score:.3f}")
    print(f"Test accuracy: {test_score:.3f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Important Features:")
    print(feature_importance.head(10))
    
    # Save model and components
    print("\nSaving model...")
    os.makedirs('../ml_models', exist_ok=True)
    
    model_data = {
        'model': model,
        'scaler': StandardScaler(),
        'label_encoder': label_encoder,
        'feature_columns': X.columns.tolist(),
        'model_version': '1.0'
    }
    
    joblib.dump(model_data, '../ml_models/clinic_risk_model.joblib')
    print("Model saved to ml_models/clinic_risk_model.joblib")
    
    # Save data
    df.to_csv('../data/combined_training_data.csv', index=False)
    print("Data saved to data/combined_training_data.csv")
    
    # Test with sample
    print("\nTesting with sample data...")
    sample_clinic = {
        'clinic_name': 'Test Medical Center',
        'website': 'https://testmedical.com',
        'license_number': 'TEST-123456',
        'year_established': 2015,
        'number_of_doctors': 5,
        'mouseMoveCount': 150,
        'keyPressCount': 45,
        'timeOnPageSeconds': 180,
        'mouseMoveRate': 0.8,
        'keyPressRate': 0.25,
        'interactionBalance': 0.7,
        'interactionScore': 0.8,
        'idleRatio': 0.2
    }
    
    # Create features for sample
    sample_features = pd.DataFrame([{
        'has_website': 1 if sample_clinic.get('website') else 0,
        'has_phone': 1 if sample_clinic.get('phone') else 0,
        'has_license': 1 if sample_clinic.get('license_number') else 0,
        'has_accreditation': 1 if sample_clinic.get('accreditation') else 0,
        'years_in_business': 2024 - sample_clinic.get('year_established', 2024),
        'number_of_doctors': sample_clinic.get('number_of_doctors', 1),
        'number_of_staff': sample_clinic.get('number_of_staff', 0),
        'mouseMoveCount': sample_clinic.get('mouseMoveCount', 0),
        'keyPressCount': sample_clinic.get('keyPressCount', 0),
        'timeOnPageSeconds': sample_clinic.get('timeOnPageSeconds', 0),
        'mouseMoveRate': sample_clinic.get('mouseMoveRate', 0),
        'keyPressRate': sample_clinic.get('keyPressRate', 0),
        'interactionBalance': sample_clinic.get('interactionBalance', 0),
        'interactionScore': sample_clinic.get('interactionScore', 0),
        'idleRatio': sample_clinic.get('idleRatio', 0)
    }])
    
    # Ensure all columns are present
    for col in X.columns:
        if col not in sample_features.columns:
            sample_features[col] = 0
    
    # Reorder columns
    sample_features = sample_features[X.columns]
    
    # Make prediction
    prediction_encoded = model.predict(sample_features)[0]
    prediction_proba = model.predict_proba(sample_features)[0]
    
    risk_level = label_encoder.inverse_transform([prediction_encoded])[0]
    confidence = np.max(prediction_proba)
    
    print(f"Sample prediction result:")
    print(f"  Risk Level: {risk_level}")
    print(f"  Confidence: {confidence:.3f}")
    print(f"  Probabilities: {dict(zip(label_encoder.classes_, prediction_proba))}")
    
    print("\nTraining completed successfully!")

if __name__ == "__main__":
    main()
