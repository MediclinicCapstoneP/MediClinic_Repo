"""
Training script specifically for your behavioral metrics data
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from clinic_risk_model import ClinicRiskModel
import os

def load_and_prepare_your_data():
    """Load and prepare your specific behavioral metrics data"""
    print("Loading your behavioral metrics data...")
    
    # Load your behavioral data
    behavior_df = pd.read_csv('data/behavior_metrics.csv')
    print(f"Loaded {len(behavior_df)} behavioral records")
    
    # Since you have behavioral data but no clinic data, 
    # let's create a comprehensive training dataset
    print("Creating clinic registration data to combine with behavioral metrics...")
    
    # Create synthetic clinic data that matches behavioral patterns
    np.random.seed(42)
    n_records = len(behavior_df)
    
    clinic_data = {
        'clinic_id': [f'clinic_{i:04d}' for i in range(n_records)],
        'clinic_name': [f'Medical Center {i}' for i in range(n_records)],
        'website': [f'https://clinic{i}.com' if np.random.random() > 0.3 else '' for i in range(n_records)],
        'phone': [f'+1-555-{i:04d}-{np.random.randint(1000, 9999)}' for i in range(n_records)],
        'email': [f'clinic{i}@healthcare.com' for i in range(n_records)],
        'license_number': [f'LIC-{i:06d}' if np.random.random() > 0.2 else '' for i in range(n_records)],
        'accreditation': [f'ACC-{i}' if np.random.random() > 0.4 else '' for i in range(n_records)],
        'tax_id': [f'{i:09d}' if np.random.random() > 0.3 else '' for i in range(n_records)],
        'year_established': np.random.randint(1990, 2024, n_records),
        'number_of_doctors': np.random.randint(1, 15, n_records),
        'number_of_staff': np.random.randint(0, 30, n_records),
        'address': [f'{i} Healthcare Ave' for i in range(n_records)],
        'city': [f'Medical City {i % 50}' for i in range(n_records)],
        'state': [f'Health State {i % 25}' for i in range(n_records)],
        'zip_code': [f'{i:05d}' for i in range(n_records)],
        'description': [f'Comprehensive medical facility {i} providing quality healthcare services.' for i in range(n_records)],
        'latitude': np.random.uniform(10, 20, n_records),
        'longitude': np.random.uniform(120, 125, n_records),
        
        # Map behavioral metrics to clinic data
        'mouseMoveCount': behavior_df['mouseMoveCount'].values,
        'keyPressCount': behavior_df['keyPressCount'].values,
        'timeOnPageSeconds': behavior_df['timeOnPageSeconds'].values,
        'mouseMoveRate': behavior_df['mouseMoveRate'].values,
        'keyPressRate': behavior_df['keyPressRate'].values,
        'interactionBalance': behavior_df['interactionBalance'].values,
        'interactionScore': behavior_df['interactionScore'].values,
        'idleRatio': behavior_df['idleRatio'].values,
        'sessionId': behavior_df['sessionId'].values,
        'captureTimestamp': behavior_df['captureTimestamp'].values,
        'behavioral_label': behavior_df['label'].values
    }
    
    # Create risk labels based on behavioral patterns
    clinic_df = pd.DataFrame(clinic_data)
    
    # Analyze behavioral patterns to create risk scores
    print("🧠 Analyzing behavioral patterns for risk assessment...")
    
    risk_scores = []
    for i, row in clinic_df.iterrows():
        score = 0.5  # Base score
        
        # Behavioral risk factors
        if row['idleRatio'] > 0.5:  # High idle time
            score += 0.1
        if row['interactionScore'] < 0.3:  # Low interaction
            score += 0.15
        if row['mouseMoveRate'] < 0.5:  # Low mouse activity
            score += 0.1
        if row['keyPressRate'] < 0.5:  # Low keyboard activity
            score += 0.1
        
        # Behavioral protective factors
        if row['interactionScore'] > 0.7:  # High interaction
            score -= 0.15
        if row['timeOnPageSeconds'] > 120:  # Good time spent
            score -= 0.1
        if row['interactionBalance'] > 0.6:  # Balanced interaction
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
    
    clinic_df['risk_score'] = risk_scores
    
    # Create risk levels
    clinic_df['risk_level'] = clinic_df['risk_score'].apply(
        lambda x: 'LOW' if x <= 0.3 else ('MEDIUM' if x <= 0.7 else 'HIGH')
    )
    
    print(f"📊 Risk distribution:")
    print(clinic_df['risk_level'].value_counts())
    
    return clinic_df

def analyze_behavioral_patterns(df):
    """Analyze behavioral patterns in your data"""
    print("\n📈 Behavioral Pattern Analysis")
    print("=" * 50)
    
    # Create visualizations
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    
    # Mouse vs Keyboard activity
    axes[0, 0].scatter(df['mouseMoveRate'], df['keyPressRate'], alpha=0.6, c=df['risk_score'], cmap='RdYlGn')
    axes[0, 0].set_title('Mouse vs Keyboard Activity')
    axes[0, 0].set_xlabel('Mouse Move Rate')
    axes[0, 0].set_ylabel('Key Press Rate')
    plt.colorbar(axes[0, 0].collections[0], ax=axes[0, 0], label='Risk Score')
    
    # Interaction Score vs Idle Ratio
    axes[0, 1].scatter(df['interactionScore'], df['idleRatio'], alpha=0.6, c=df['risk_score'], cmap='RdYlGn')
    axes[0, 1].set_title('Interaction Score vs Idle Ratio')
    axes[0, 1].set_xlabel('Interaction Score')
    axes[0, 1].set_ylabel('Idle Ratio')
    
    # Time on Page distribution
    axes[0, 2].hist(df['timeOnPageSeconds'], bins=30, alpha=0.7)
    axes[0, 2].set_title('Time on Page Distribution')
    axes[0, 2].set_xlabel('Time on Page (seconds)')
    axes[0, 2].set_ylabel('Frequency')
    
    # Risk Score by Interaction Balance
    axes[1, 0].boxplot([df[df['interactionBalance'] < 0.3]['risk_score'],
                                   df[(df['interactionBalance'] >= 0.3) & (df['interactionBalance'] < 0.7)]['risk_score'],
                                   df[df['interactionBalance'] >= 0.7]['risk_score']])
    axes[1, 0].set_title('Risk Score by Interaction Balance')
    axes[1, 0].set_xticklabels(['Low', 'Medium', 'High'])
    axes[1, 0].set_ylabel('Risk Score')
    
    # Behavioral metrics correlation
    behavioral_cols = ['mouseMoveCount', 'keyPressCount', 'timeOnPageSeconds', 
                     'mouseMoveRate', 'keyPressRate', 'interactionBalance', 
                     'interactionScore', 'idleRatio']
    correlation_matrix = df[behavioral_cols].corr()
    
    axes[1, 1].imshow(correlation_matrix, cmap='coolwarm', aspect='auto')
    axes[1, 1].set_title('Behavioral Metrics Correlation')
    axes[1, 1].set_xticks(range(len(behavioral_cols)), behavioral_cols, rotation=45)
    axes[1, 1].set_yticks(range(len(behavioral_cols)), behavioral_cols)
    
    # Risk level distribution
    df['risk_level'].value_counts().plot(kind='bar', ax=axes[1, 2])
    axes[1, 2].set_title('Risk Level Distribution')
    axes[1, 2].set_xlabel('Risk Level')
    axes[1, 2].set_ylabel('Count')
    
    plt.tight_layout()
    plt.savefig('ml_models/behavioral_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # Print insights
    print("\n🔍 Key Insights:")
    print(f"• Average interaction score: {df['interactionScore'].mean():.3f}")
    print(f"• Average idle ratio: {df['idleRatio'].mean():.3f}")
    print(f"• Average time on page: {df['timeOnPageSeconds'].mean():.1f} seconds")
    print(f"• High risk clinics: {len(df[df['risk_level'] == 'HIGH'])} ({len(df[df['risk_level'] == 'HIGH'])/len(df)*100:.1f}%)")
    print(f"• Medium risk clinics: {len(df[df['risk_level'] == 'MEDIUM'])} ({len(df[df['risk_level'] == 'MEDIUM'])/len(df)*100:.1f}%)")
    print(f"• Low risk clinics: {len(df[df['risk_level'] == 'LOW'])} ({len(df[df['risk_level'] == 'LOW'])/len(df)*100:.1f}%)")

def train_enhanced_model():
    """Train model with your specific data"""
    print("🚀 Training ML Model with Your Behavioral Data")
    print("=" * 60)
    
    # Prepare data
    df = load_and_prepare_your_data()
    
    # Analyze patterns
    analyze_behavioral_patterns(df)
    
    # Save prepared data
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/combined_clinic_behavioral_data.csv', index=False)
    print(f"💾 Saved combined data to data/combined_clinic_behavioral_data.csv")
    
    # Initialize and train model
    risk_model = ClinicRiskModel()
    risk_model.training_data_path = 'data/combined_clinic_behavioral_data.csv'
    
    print("\n🤖 Starting Model Training...")
    if risk_model.train_model(test_size=0.2):
        # Save model
        if risk_model.save_model():
            print("\n✅ Model training completed successfully!")
            
            # Test with sample
            print("\n🔮 Testing with sample clinic data...")
            sample_clinic = {
                'clinic_name': 'Test Medical Center',
                'website': 'https://testmedical.com',
                'phone': '+1-555-0123-4567',
                'license_number': 'TEST-123456',
                'accreditation': 'Test Accreditation',
                'year_established': 2015,
                'number_of_doctors': 5,
                'number_of_staff': 10,
                'address': '123 Healthcare Ave',
                'city': 'Test City',
                'state': 'Test State',
                'zip_code': '12345',
                'description': 'A comprehensive medical center providing quality healthcare services.',
                
                # Behavioral metrics for testing
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
                print("✅ Sample Prediction Result:")
                import json
                print(json.dumps(prediction, indent=2))
            else:
                print("❌ Sample prediction failed")
        else:
            print("❌ Failed to save model")
    else:
        print("❌ Model training failed")

def main():
    """Main execution function"""
    print("ML Training Guide - Your Behavioral Data")
    print("This script will:")
    print("1. Load your behavioral_metrics.csv")
    print("2. Create comprehensive clinic data")
    print("3. Analyze behavioral patterns")
    print("4. Train ML model")
    print("5. Test with sample data")
    
    # Check if behavioral data exists
    if not os.path.exists('data/behavior_metrics.csv'):
        print("❌ behavioral_metrics.csv not found in data/ directory")
        print("Please ensure your behavioral data file is in the correct location")
        return
    
    # Start training
    train_enhanced_model()

if __name__ == "__main__":
    main()
