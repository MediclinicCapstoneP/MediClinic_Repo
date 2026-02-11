"""
Training script for clinic risk assessment model
Usage: python train_model.py [--data-path path/to/behavior_metrics.csv]
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from clinic_risk_model import ClinicRiskModel
import argparse
import os

def create_sample_behavioral_data():
    """Create sample behavioral metrics data for demonstration"""
    print("📝 Creating sample behavioral data...")
    
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'clinic_id': [f'clinic_{i:04d}' for i in range(n_samples)],
        'submission_timestamp': pd.date_range('2023-01-01', periods=n_samples, freq='H'),
        'clinic_name': [f'Clinic {i}' for i in range(n_samples)],
        'website': [f'https://clinic{i}.com' if np.random.random() > 0.3 else '' for i in range(n_samples)],
        'phone': [f'+1-555-{i:04d}-{np.random.randint(1000, 9999)}' for i in range(n_samples)],
        'email': [f'clinic{i}@example.com' for i in range(n_samples)],
        'license_number': [f'LIC-{i:06d}' if np.random.random() > 0.2 else '' for i in range(n_samples)],
        'accreditation': [f'ACC-{i}' if np.random.random() > 0.4 else '' for i in range(n_samples)],
        'tax_id': [f'{i:09d}' if np.random.random() > 0.3 else '' for i in range(n_samples)],
        'year_established': np.random.randint(1990, 2024, n_samples),
        'number_of_doctors': np.random.randint(1, 20, n_samples),
        'number_of_staff': np.random.randint(0, 50, n_samples),
        'address': [f'{i} Main St' for i in range(n_samples)],
        'city': [f'City {i % 100}' for i in range(n_samples)],
        'state': [f'State {i % 50}' for i in range(n_samples)],
        'zip_code': [f'{i:05d}' for i in range(n_samples)],
        'description': [f'Medical clinic {i} providing healthcare services.' for i in range(n_samples)],
        'latitude': np.random.uniform(10, 20, n_samples),
        'longitude': np.random.uniform(120, 125, n_samples),
        
        # Behavioral metrics
        'login_frequency': np.random.exponential(5, n_samples),
        'profile_completion_time': np.random.exponential(600, n_samples),  # seconds
        'data_modification_count': np.random.poisson(3, n_samples),
        'session_duration_avg': np.random.exponential(1800, n_samples),  # seconds
        'time_to_first_appointment': np.random.exponential(86400, n_samples),  # seconds
        'support_ticket_count': np.random.poisson(1, n_samples),
        'document_upload_count': np.random.poisson(5, n_samples),
        'profile_view_count': np.random.exponential(50, n_samples),
        
        # Risk labels (for supervised learning)
        'risk_score': np.random.beta(2, 5, n_samples),  # Bias toward lower risk
        'is_fraud_reported': np.random.choice([0, 1], n_samples, p=[0.95, 0.05]),
        'manual_review_required': np.random.choice([0, 1], n_samples, p=[0.8, 0.2]),
        'complaint_count': np.random.poisson(0.5, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Create risk level labels
    df['risk_level'] = df['risk_score'].apply(
        lambda x: 'LOW' if x <= 0.3 else ('MEDIUM' if x <= 0.7 else 'HIGH')
    )
    
    # Add some realistic correlations
    # Higher risk clinics tend to have missing information
    mask_high_risk = df['risk_level'] == 'HIGH'
    df.loc[mask_high_risk, 'license_number'] = df.loc[mask_high_risk, 'license_number'].apply(
        lambda x: x if np.random.random() > 0.6 else ''
    )
    df.loc[mask_high_risk, 'accreditation'] = df.loc[mask_high_risk, 'accreditation'].apply(
        lambda x: x if np.random.random() > 0.7 else ''
    )
    
    # Lower risk clinics tend to be established
    mask_low_risk = df['risk_level'] == 'LOW'
    df.loc[mask_low_risk, 'year_established'] = df.loc[mask_low_risk, 'year_established'].apply(
        lambda x: max(x, np.random.randint(2000, 2015))
    )
    
    return df

def analyze_data(df):
    """Perform exploratory data analysis"""
    print("\n📊 Data Analysis")
    print("=" * 50)
    
    print(f"Dataset shape: {df.shape}")
    print(f"Risk level distribution:")
    print(df['risk_level'].value_counts())
    
    # Create visualizations
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # Risk score distribution
    axes[0, 0].hist(df['risk_score'], bins=30, alpha=0.7)
    axes[0, 0].set_title('Risk Score Distribution')
    axes[0, 0].set_xlabel('Risk Score')
    axes[0, 0].set_ylabel('Frequency')
    
    # Risk level counts
    df['risk_level'].value_counts().plot(kind='bar', ax=axes[0, 1])
    axes[0, 1].set_title('Risk Level Distribution')
    axes[0, 1].set_xlabel('Risk Level')
    axes[0, 1].set_ylabel('Count')
    
    # Years in business vs risk
    axes[1, 0].scatter(df['year_established'], df['risk_score'], alpha=0.5)
    axes[1, 0].set_title('Year Established vs Risk Score')
    axes[1, 0].set_xlabel('Year Established')
    axes[1, 0].set_ylabel('Risk Score')
    
    # Number of doctors vs risk
    axes[1, 1].scatter(df['number_of_doctors'], df['risk_score'], alpha=0.5)
    axes[1, 1].set_title('Number of Doctors vs Risk Score')
    axes[1, 1].set_xlabel('Number of Doctors')
    axes[1, 1].set_ylabel('Risk Score')
    
    plt.tight_layout()
    plt.savefig('ml_models/data_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # Correlation matrix
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    correlation_matrix = df[numeric_cols].corr()
    
    plt.figure(figsize=(12, 8))
    sns.heatmap(correlation_matrix, annot=False, cmap='coolwarm', center=0)
    plt.title('Feature Correlation Matrix')
    plt.tight_layout()
    plt.savefig('ml_models/correlation_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()

def main():
    parser = argparse.ArgumentParser(description='Train clinic risk assessment model')
    parser.add_argument('--data-path', type=str, help='Path to behavioral metrics CSV file')
    parser.add_argument('--create-sample', action='store_true', help='Create sample data for training')
    parser.add_argument('--analyze-only', action='store_true', help='Only analyze data, don\'t train')
    
    args = parser.parse_args()
    
    # Create ml_models directory if it doesn't exist
    os.makedirs('ml_models', exist_ok=True)
    
    # Load or create data
    if args.create_sample or not args.data_path:
        print("📝 Creating sample behavioral data...")
        df = create_sample_behavioral_data()
        
        # Save sample data
        sample_path = 'data/behavior_metrics.csv'
        os.makedirs('data', exist_ok=True)
        df.to_csv(sample_path, index=False)
        print(f"✅ Sample data saved to {sample_path}")
        args.data_path = sample_path
    
    elif args.data_path:
        print(f"📂 Loading data from {args.data_path}")
        df = pd.read_csv(args.data_path)
    else:
        print("❌ No data path provided. Use --data-path or --create-sample")
        return
    
    # Analyze data
    analyze_data(df)
    
    if args.analyze_only:
        print("📊 Analysis complete. Skipping training.")
        return
    
    # Train model
    print("\n🚀 Training ML Model...")
    risk_model = ClinicRiskModel()
    
    # Update data path if custom path provided
    if args.data_path != 'data/behavior_metrics.csv':
        risk_model.training_data_path = args.data_path
    
    # Train the model
    if risk_model.train_model():
        # Save model
        risk_model.save_model()
        
        # Test with sample data
        print("\n🔮 Testing model with sample clinic...")
        sample_clinic = {
            'clinic_name': 'New Medical Center',
            'website': 'https://newmedical.com',
            'phone': '+1-555-999-0000',
            'email': 'contact@newmedical.com',
            'license_number': 'NEW-123456',
            'accreditation': 'New Accreditation Body',
            'year_established': 2020,
            'number_of_doctors': 3,
            'number_of_staff': 5,
            'address': '456 Healthcare Ave',
            'city': 'New City',
            'state': 'New State',
            'zip_code': '54321',
            'description': 'A modern medical facility providing comprehensive healthcare services with state-of-the-art equipment and experienced medical professionals.'
        }
        
        prediction = risk_model.predict_risk(sample_clinic)
        if prediction:
            print("✅ Sample prediction successful:")
            import json
            print(json.dumps(prediction, indent=2))
        else:
            print("❌ Sample prediction failed")
    else:
        print("❌ Model training failed")

if __name__ == "__main__":
    main()
