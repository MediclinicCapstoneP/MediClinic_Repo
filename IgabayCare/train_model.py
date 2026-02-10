#!/usr/bin/env python3
"""
Quick model training script for behavioral biometrics
"""

import subprocess
import sys
import os

def run_command(cmd):
    """Run command and return result"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(f"Error: {result.stderr}")
        return False
    print(result.stdout)
    return True

def main():
    print("Setting up Python environment for behavioral biometrics model...")
    
    # Check if pip is available
    if not run_command("python -m pip --version"):
        print("Python pip not found. Please install Python and pip first.")
        return
    
    # Install requirements
    print("Installing Python dependencies...")
    if not run_command("python -m pip install -r requirements.txt"):
        print("Failed to install dependencies")
        return
    
    # Generate sample data
    print("Generating sample training data...")
    if not run_command("python src/ml/behavior_training.py --generate-sample data/behavior_metrics.csv --sample-size 2000"):
        print("Failed to generate sample data")
        return
    
    # Train model
    print("Training behavioral biometrics model...")
    if not run_command("python src/ml/behavior_training.py --data data/behavior_metrics.csv --output models/behavior_model.joblib"):
        print("Failed to train model")
        return
    
    print("Model training completed successfully!")
    print("Model saved to: models/behavior_model.joblib")
    print("You can now start the behavior auth server.")

if __name__ == "__main__":
    main()
