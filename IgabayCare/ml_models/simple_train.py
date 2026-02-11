"""
Simple training script for your behavioral metrics data
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from clinic_risk_model import ClinicRiskModel
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
    
    # Save data
    os.makedirs('../data', exist_ok=True)
    df.to_csv('../data/combined_training_data.csv', index=False)
    print("Saved combined data to data/combined_training_data.csv")
    
    # Train model
    print("\nTraining ML model...")
    risk_model = ClinicRiskModel()
    risk_model.training_data_path = '../data/combined_training_data.csv'
    
    if risk_model.train_model(test_size=0.2):
        if risk_model.save_model():
            print("Model training completed successfully!")
            
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
            
            prediction = risk_model.predict_risk(sample_clinic)
            if prediction:
                print("Sample prediction result:")
                for key, value in prediction.items():
                    print(f"  {key}: {value}")
            else:
                print("Sample prediction failed")
        else:
            print("Failed to save model")
    else:
        print("Model training failed")

if __name__ == "__main__":
    main()
