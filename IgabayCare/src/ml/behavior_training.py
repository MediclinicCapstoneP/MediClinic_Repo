#!/usr/bin/env python3
"""
Behavioral Biometrics Training Script
Trains a supervised ML model to distinguish human vs bot behavior
"""

import pandas as pd
import numpy as np
import joblib
import argparse
import time
from pathlib import Path
from typing import Tuple, Dict, Any
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import json
import os

# Feature columns from BehaviorFeatureSnapshot
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

def load_data(csv_path: str) -> pd.DataFrame:
    """Load behavioral data from CSV file"""
    df = pd.read_csv(csv_path)
    
    # Filter out rows without labels (unlabeled data)
    df = df[df['label'].isin([0, 1])]
    
    # Convert label to int
    df['label'] = df['label'].astype(int)
    
    print(f"Loaded {len(df)} labeled samples")
    print(f"Human samples: {df['label'].value_counts().get(1, 0)}")
    print(f"Bot samples: {df['label'].value_counts().get(0, 0)}")
    
    return df

def prepare_features(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """Prepare features and labels for training"""
    # Select feature columns
    X = df[FEATURE_COLUMNS].values
    y = df['label'].values
    
    # Handle any NaN values
    X = np.nan_to_num(X, nan=0.0)
    
    return X, y

def train_model(X_train: np.ndarray, y_train: np.ndarray) -> Tuple[RandomForestClassifier, StandardScaler]:
    """Train RandomForest model with feature scaling"""
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # Train RandomForest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'  # Handle class imbalance
    )
    
    model.fit(X_train_scaled, y_train)
    
    return model, scaler

def evaluate_model(model: RandomForestClassifier, scaler: StandardScaler, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
    """Evaluate model performance"""
    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test_scaled)
    
    # Calculate ROC AUC
    from sklearn.metrics import roc_auc_score, roc_curve
    roc_auc = roc_auc_score(y_test, y_proba[:, 1])
    
    # Cross-validation scores
    cv_scores = cross_val_score(model, scaler.transform(X_test), y_test, cv=5, scoring='accuracy')
    
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'classification_report': classification_report(y_test, y_pred, output_dict=True),
        'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
        'feature_importance': dict(zip(FEATURE_COLUMNS, model.feature_importances_.tolist())),
        'roc_auc': float(roc_auc),
        'cross_validation_scores': {
            'mean': float(cv_scores.mean()),
            'std': float(cv_scores.std()),
            'scores': cv_scores.tolist()
        }
    }
    
    return metrics

def generate_sample_data(output_path: str, n_samples: int = 1000):
    """Generate synthetic training data for testing"""
    np.random.seed(42)
    
    # Human-like behavior patterns
    human_samples = n_samples // 2
    bot_samples = n_samples - human_samples
    
    data = []
    
    # Generate human samples
    for i in range(human_samples):
        time_on_page = np.random.uniform(30, 300)  # 30s to 5min
        mouse_moves = int(np.random.uniform(20, 200))
        key_presses = int(np.random.uniform(5, 50))
        
        sample = {
            'mouseMoveCount': mouse_moves,
            'keyPressCount': key_presses,
            'timeOnPageSeconds': time_on_page,
            'mouseMoveRate': mouse_moves / time_on_page,
            'keyPressRate': key_presses / time_on_page,
            'interactionBalance': abs(mouse_moves - key_presses) / (mouse_moves + key_presses + 1),
            'interactionScore': min(1, (mouse_moves + key_presses) / (time_on_page * 2)),
            'idleRatio': np.random.uniform(0.1, 0.4),
            'sessionId': f'human-{i}',
            'captureTimestamp': pd.Timestamp.now().isoformat(),
            'label': 1,
            'labelSource': 'synthetic'
        }
        data.append(sample)
    
    # Generate bot samples
    for i in range(bot_samples):
        time_on_page = np.random.uniform(2, 10)  # Very fast
        mouse_moves = int(np.random.uniform(0, 5))
        key_presses = int(np.random.uniform(0, 2))
        
        sample = {
            'mouseMoveCount': mouse_moves,
            'keyPressCount': key_presses,
            'timeOnPageSeconds': time_on_page,
            'mouseMoveRate': mouse_moves / time_on_page,
            'keyPressRate': key_presses / time_on_page,
            'interactionBalance': abs(mouse_moves - key_presses) / (mouse_moves + key_presses + 1),
            'interactionScore': min(1, (mouse_moves + key_presses) / (time_on_page * 2)),
            'idleRatio': np.random.uniform(0.6, 0.9),  # High idle ratio
            'sessionId': f'bot-{i}',
            'captureTimestamp': pd.Timestamp.now().isoformat(),
            'label': 0,
            'labelSource': 'synthetic'
        }
        data.append(sample)
    
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False)
    print(f"Generated {n_samples} synthetic samples at {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Train behavioral biometrics model')
    parser.add_argument('--data', type=str, help='Path to CSV training data')
    parser.add_argument('--output', type=str, default='models/behavior_model.joblib', help='Output model path')
    parser.add_argument('--generate-sample', type=str, help='Generate sample data at specified path')
    parser.add_argument('--sample-size', type=int, default=5000, help='Number of samples to generate')
    
    args = parser.parse_args()
    
    # Generate sample data if requested
    if args.generate_sample:
        os.makedirs(os.path.dirname(args.generate_sample), exist_ok=True)
        generate_sample_data(args.generate_sample, args.sample_size)
        return
    
    # Load data
    if not args.data:
        print("Error: Please provide training data path with --data or generate sample data with --generate-sample")
        return
    
    df = load_data(args.data)
    
    if len(df) < 50:
        print("Error: Need at least 50 labeled samples for training")
        return
    
    # Prepare features
    X, y = prepare_features(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train model
    print("Training model...")
    start_time = time.time()
    model, scaler = train_model(X_train, y_train)
    training_time = (time.time() - start_time) * 1000  # Convert to ms
    
    # Evaluate
    print("Evaluating model...")
    metrics = evaluate_model(model, scaler, X_test, y_test)
    
    # Calculate model size
    model_size = os.path.getsize(args.output) / (1024 * 1024) if os.path.exists(args.output) else 0
    
    # Add training metrics
    metrics['training_time_ms'] = int(training_time)
    metrics['model_size_mb'] = model_size
    
    print(f"Accuracy: {metrics['accuracy']:.3f}")
    print(f"ROC AUC: {metrics['roc_auc']:.3f}")
    print(f"Cross-validation accuracy: {metrics['cross_validation_scores']['mean']:.3f} ± {metrics['cross_validation_scores']['std']:.3f}")
    print("Classification Report:")
    print(json.dumps(metrics['classification_report'], indent=2))
    print("Feature Importance:")
    print(json.dumps(metrics['feature_importance'], indent=2))
    
    # Save model and scaler
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    joblib.dump({
        'model': model,
        'scaler': scaler,
        'features': FEATURE_COLUMNS,
        'metrics': metrics,
        'version': '1.0.0'
    }, args.output)
    
    print(f"Model saved to {args.output}")
    print(f"Training time: {training_time:.0f}ms")
    print(f"Model size: {model_size:.2f}MB")

if __name__ == "__main__":
    main()
