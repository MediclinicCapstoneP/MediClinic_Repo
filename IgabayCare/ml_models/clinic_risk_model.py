"""
Clinic Risk Assessment ML Model
Trains machine learning models using behavioral metrics and clinic metadata
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.pipeline import Pipeline
import joblib
import json
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class ClinicRiskModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.model_version = "2.0"
        self.training_data_path = "data/behavior_metrics.csv"
        
    def load_training_data(self):
        """Load behavioral metrics and clinic data for training"""
        try:
            # Load behavioral metrics
            behavior_df = pd.read_csv(self.training_data_path)
            print(f"📊 Loaded {len(behavior_df)} behavioral records")
            
            # If we have clinic data, merge it
            try:
                clinic_df = pd.read_csv("data/clinic_registrations.csv")
                print(f"🏥 Loaded {len(clinic_df)} clinic records")
                
                # Merge datasets on clinic_id or user_id
                merged_df = pd.merge(behavior_df, clinic_df, 
                                  left_on='clinic_id', right_on='id', 
                                  how='left')
            except FileNotFoundError:
                print("⚠️ Clinic registration data not found, using behavioral data only")
                merged_df = behavior_df
            
            return merged_df
            
        except FileNotFoundError:
            print(f"❌ Training data not found at {self.training_data_path}")
            return None
        except Exception as e:
            print(f"❌ Error loading training data: {e}")
            return None
    
    def engineer_features(self, df):
        """Engineer features from raw behavioral and clinic data"""
        print("🔧 Engineering features...")
        
        features = pd.DataFrame()
        
        # 1. Submission Pattern Features
        if 'submission_timestamp' in df.columns:
            df['submission_timestamp'] = pd.to_datetime(df['submission_timestamp'])
            df['submission_hour'] = df['submission_timestamp'].dt.hour
            df['submission_day_of_week'] = df['submission_timestamp'].dt.dayofweek
            df['is_weekend_submission'] = df['submission_day_of_week'].isin([5, 6]).astype(int)
            df['is_business_hours'] = df['submission_hour'].between(9, 17).astype(int)
            df['is_late_night'] = df['submission_hour'].between(22, 6).astype(int)
            
            features['submission_hour'] = df['submission_hour']
            features['submission_day_of_week'] = df['submission_day_of_week']
            features['is_weekend_submission'] = df['is_weekend_submission']
            features['is_business_hours'] = df['is_business_hours']
            features['is_late_night'] = df['is_late_night']
        
        # 2. Clinic Information Features
        if 'clinic_name' in df.columns:
            features['clinic_name_length'] = df['clinic_name'].fillna('').str.len()
            features['has_numbers_in_name'] = df['clinic_name'].fillna('').str.contains(r'\d').astype(int)
        
        if 'website' in df.columns:
            features['has_website'] = df['website'].notna().astype(int)
            features['website_length'] = df['website'].fillna('').str.len()
            
        if 'phone' in df.columns:
            features['has_phone'] = df['phone'].notna().astype(int)
            features['phone_length'] = df['phone'].fillna('').str.len()
            features['phone_is_valid'] = df['phone'].fillna('').str.match(r'^[\+]?[1-9][\d]{0,15}$').astype(int)
        
        if 'email' in df.columns:
            features['email_length'] = df['email'].fillna('').str.len()
            features['email_domain_type'] = df['email'].fillna('').apply(self._classify_email_domain)
        
        # 3. License and Accreditation Features
        if 'license_number' in df.columns:
            features['has_license'] = df['license_number'].notna().astype(int)
            features['license_length'] = df['license_number'].fillna('').str.len()
            features['license_format_valid'] = df['license_number'].fillna('').str.match(r'^[A-Z0-9]{6,20}$').astype(int)
        
        if 'accreditation' in df.columns:
            features['has_accreditation'] = df['accreditation'].notna().astype(int)
            features['accreditation_length'] = df['accreditation'].fillna('').str.len()
        
        if 'tax_id' in df.columns:
            features['has_tax_id'] = df['tax_id'].notna().astype(int)
            features['tax_id_format_valid'] = df['tax_id'].fillna('').str.match(r'^\d{9,12}$').astype(int)
        
        # 4. Location Features
        location_cols = ['address', 'city', 'state', 'zip_code']
        for col in location_cols:
            if col in df.columns:
                features[f'has_{col}'] = df[col].notna().astype(int)
                features[f'{col}_length'] = df[col].fillna('').str.len()
        
        if all(col in df.columns for col in location_cols):
            features['address_completeness'] = df[location_cols].notna().sum(axis=1) / len(location_cols)
        
        if 'latitude' in df.columns and 'longitude' in df.columns:
            features['has_coordinates'] = df[['latitude', 'longitude']].notna().all(axis=1).astype(int)
        
        # 5. Business Maturity Features
        if 'year_established' in df.columns:
            current_year = datetime.now().year
            df['years_in_business'] = current_year - df['year_established'].fillna(current_year)
            features['years_in_business'] = df['years_in_business']
            features['is_new_business'] = (df['years_in_business'] < 1).astype(int)
            features['is_established'] = (df['years_in_business'] >= 5).astype(int)
        
        # 6. Scale Features
        if 'number_of_doctors' in df.columns:
            features['number_of_doctors'] = df['number_of_doctors'].fillna(1)
            features['is_solo_practice'] = (df['number_of_doctors'] == 1).astype(int)
            features['is_large_clinic'] = (df['number_of_doctors'] > 10).astype(int)
        
        if 'number_of_staff' in df.columns:
            features['number_of_staff'] = df['number_of_staff'].fillna(0)
            if 'number_of_doctors' in df.columns:
                features['doctor_to_staff_ratio'] = df['number_of_staff'] / df['number_of_doctors'].replace(0, 1)
        
        # 7. Service Features
        service_cols = ['specialties', 'custom_specialties', 'services', 'custom_services']
        for col in service_cols:
            if col in df.columns:
                # Count array items (assuming JSON-like format)
                features[f'{col}_count'] = df[col].fillna('[]').apply(self._count_array_items)
        
        if all(col in df.columns for col in ['specialties', 'custom_specialties']):
            features['total_specialties'] = features['specialties_count'] + features['custom_specialties_count']
            features['has_custom_specialties'] = (features['custom_specialties_count'] > 0).astype(int)
        
        # 8. Behavioral Metrics (if available)
        if 'login_frequency' in df.columns:
            features['login_frequency'] = df['login_frequency']
            features['is_active_user'] = (df['login_frequency'] > 5).astype(int)
        
        if 'profile_completion_time' in df.columns:
            features['profile_completion_time'] = df['profile_completion_time']
            features['completed_profile_quickly'] = (df['profile_completion_time'] < 300).astype(int)  # < 5 minutes
        
        if 'data_modification_count' in df.columns:
            features['data_modification_count'] = df['data_modification_count']
            features['frequent_modifications'] = (df['data_modification_count'] > 10).astype(int)
        
        if 'session_duration_avg' in df.columns:
            features['session_duration_avg'] = df['session_duration_avg']
            features['long_sessions'] = (df['session_duration_avg'] > 1800).astype(int)  # > 30 minutes
        
        # 9. Text Quality Features
        if 'description' in df.columns:
            features['description_length'] = df['description'].fillna('').str.len()
            features['has_description'] = (df['description'].fillna('').str.len() > 0).astype(int)
            features['description_quality'] = df['description'].fillna('').apply(self._calculate_text_quality)
        
        print(f"✅ Engineered {len(features.columns)} features")
        return features
    
    def _classify_email_domain(self, email):
        """Classify email domain type"""
        if not isinstance(email, str) or '@' not in email:
            return 'unknown'
        
        domain = email.split('@')[1].lower()
        
        if any(provider in domain for provider in ['gmail', 'yahoo', 'hotmail', 'outlook']):
            return 'personal'
        elif any(provider in domain for provider in ['clinic', 'medical', 'health']):
            return 'professional'
        else:
            return 'business'
    
    def _count_array_items(self, array_str):
        """Count items in JSON array string"""
        try:
            if pd.isna(array_str) or array_str == '':
                return 0
            if isinstance(array_str, str):
                import json
                return len(json.loads(array_str))
            return len(array_str) if hasattr(array_str, '__len__') else 0
        except:
            return 0
    
    def _calculate_text_quality(self, text):
        """Calculate text quality score"""
        if not isinstance(text, str) or len(text) == 0:
            return 0.0
        
        score = 0.0
        
        # Length scoring
        if len(text) > 50:
            score += 0.3
        if len(text) > 150:
            score += 0.2
        if len(text) > 300:
            score += 0.2
        
        # Content quality indicators
        medical_terms = ['medical', 'healthcare', 'patients', 'treatment', 'care', 'professional']
        found_terms = sum(1 for term in medical_terms if term.lower() in text.lower())
        score += min(0.3, found_terms * 0.1)
        
        return min(1.0, score)
    
    def prepare_labels(self, df):
        """Prepare target labels for supervised learning"""
        # For demonstration, create synthetic risk labels based on features
        # In production, these would come from manual reviews or historical outcomes
        
        if 'risk_score' in df.columns:
            # Use existing risk scores if available
            risk_scores = df['risk_score'].fillna(0.5)
        else:
            # Create synthetic risk scores based on feature patterns
            risk_scores = self._create_synthetic_risk_scores(df)
        
        # Convert to risk levels
        risk_levels = []
        for score in risk_scores:
            if score <= 0.3:
                risk_levels.append('LOW')
            elif score <= 0.7:
                risk_levels.append('MEDIUM')
            else:
                risk_levels.append('HIGH')
        
        return np.array(risk_levels), risk_scores
    
    def _create_synthetic_risk_scores(self, df):
        """Create synthetic risk scores for demonstration"""
        scores = []
        
        for _, row in df.iterrows():
            score = 0.5  # Base score
            
            # Risk factors (increase score)
            if not row.get('has_license', True):
                score += 0.2
            if not row.get('has_website', True):
                score += 0.1
            if row.get('is_new_business', False):
                score += 0.15
            if row.get('is_solo_practice', False):
                score += 0.1
            if not row.get('has_accreditation', True):
                score += 0.1
            
            # Protective factors (decrease score)
            if row.get('years_in_business', 0) > 5:
                score -= 0.1
            if row.get('has_accreditation', False):
                score -= 0.1
            if row.get('license_format_valid', False):
                score -= 0.15
            
            scores.append(max(0.0, min(1.0, score)))
        
        return np.array(scores)
    
    def train_model(self, test_size=0.2, random_state=42):
        """Train the risk assessment model"""
        print("Starting model training...")
        
        # Load and prepare data
        df = self.load_training_data()
        if df is None:
            print("No training data available")
            return False
        
        # Engineer features
        X = self.engineer_features(df)
        y, risk_scores = self.prepare_labels(df)
        
        # Store feature columns
        self.feature_columns = X.columns.tolist()
        
        # Handle categorical variables
        X_encoded = self._encode_categorical_features(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        print(f"📊 Training set: {len(X_train)} samples")
        print(f"📊 Test set: {len(X_test)} samples")
        
        # Try multiple models
        models = {
            'RandomForest': RandomForestClassifier(n_estimators=100, random_state=random_state),
            'GradientBoosting': GradientBoostingClassifier(random_state=random_state),
            'LogisticRegression': LogisticRegression(random_state=random_state, max_iter=1000)
        }
        
        best_model = None
        best_score = 0
        best_name = ""
        
        for name, model in models.items():
            print(f"\n🔍 Training {name}...")
            
            # Create pipeline with scaling
            pipeline = Pipeline([
                ('scaler', StandardScaler()),
                ('classifier', model)
            ])
            
            # Cross-validation
            cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='f1_weighted')
            avg_score = cv_scores.mean()
            
            print(f"📈 {name} CV Score: {avg_score:.3f}")
            
            if avg_score > best_score:
                best_score = avg_score
                best_model = pipeline
                best_name = name
        
        print(f"\n🏆 Best model: {best_name} (Score: {best_score:.3f})")
        
        # Train best model on full training set
        best_model.fit(X_train, y_train)
        
        # Evaluate on test set
        y_pred = best_model.predict(X_test)
        print("\n📊 Test Set Performance:")
        print(classification_report(y_test, y_pred))
        
        # Feature importance (for tree-based models)
        if hasattr(best_model.named_steps['classifier'], 'feature_importances_'):
            self._show_feature_importance(
                best_model.named_steps['classifier'], 
                X_encoded.columns
            )
        
        self.model = best_model
        print("✅ Model training completed successfully!")
        return True
    
    def _encode_categorical_features(self, X):
        """Encode categorical features"""
        X_encoded = X.copy()
        
        categorical_cols = X_encoded.select_dtypes(include=['object']).columns
        
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                X_encoded[col] = self.label_encoders[col].fit_transform(X_encoded[col].fillna('unknown'))
            else:
                X_encoded[col] = self.label_encoders[col].transform(X_encoded[col].fillna('unknown'))
        
        return X_encoded.fillna(0)
    
    def _show_feature_importance(self, model, feature_names):
        """Display feature importance"""
        if hasattr(model, 'feature_importances_'):
            importance_df = pd.DataFrame({
                'feature': feature_names,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            print("\n🎯 Top 10 Important Features:")
            print(importance_df.head(10).to_string(index=False))
    
    def predict_risk(self, clinic_data):
        """Predict risk for new clinic data"""
        if self.model is None:
            print("❌ Model not trained. Call train_model() first.")
            return None
        
        try:
            # Convert to DataFrame if needed
            if isinstance(clinic_data, dict):
                df = pd.DataFrame([clinic_data])
            else:
                df = clinic_data.copy()
            
            # Engineer features
            X = self.engineer_features(df)
            
            # Ensure all expected columns are present
            for col in self.feature_columns:
                if col not in X.columns:
                    X[col] = 0
            
            # Select only training columns
            X = X[self.feature_columns]
            
            # Encode categorical features
            X_encoded = self._encode_categorical_features(X)
            
            # Make prediction
            risk_level = self.model.predict(X_encoded)[0]
            risk_proba = self.model.predict_proba(X_encoded)[0]
            
            # Get risk score (probability of HIGH/MEDIUM risk)
            high_prob = risk_proba[2] if len(risk_proba) > 2 else 0  # HIGH risk probability
            medium_prob = risk_proba[1] if len(risk_proba) > 1 else 0  # MEDIUM risk probability
            risk_score = high_prob * 0.7 + medium_prob * 0.3  # Weighted score
            
            # Generate risk flags
            risk_flags = self._generate_risk_flags(df.iloc[0])
            
            # Recommend account status
            account_status = self._recommend_account_status(risk_score, risk_level, df.iloc[0])
            
            result = {
                'risk_score': float(risk_score),
                'risk_level': risk_level,
                'account_status': account_status,
                'risk_flags': risk_flags,
                'confidence': float(np.max(risk_proba)),
                'model_version': self.model_version,
                'prediction_timestamp': datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            print(f"❌ Error making prediction: {e}")
            return None
    
    def _generate_risk_flags(self, clinic_data):
        """Generate risk flags based on clinic data"""
        flags = []
        
        if not clinic_data.get('has_website', True):
            flags.append('NO_WEBSITE')
        if not clinic_data.get('has_license', True):
            flags.append('NO_LICENSE')
        if not clinic_data.get('license_format_valid', True):
            flags.append('INVALID_LICENSE_FORMAT')
        if not clinic_data.get('has_accreditation', True):
            flags.append('NO_ACCREDITATION')
        if clinic_data.get('is_new_business', False):
            flags.append('NEW_BUSINESS')
        if clinic_data.get('is_solo_practice', False):
            flags.append('SOLO_PRACTICE')
        
        return flags
    
    def _recommend_account_status(self, risk_score, risk_level, clinic_data):
        """Recommend account status based on risk assessment"""
        if risk_level == 'HIGH':
            return 'RESTRICTED'
        elif risk_level == 'LOW' and clinic_data.get('has_license', False):
            return 'ACTIVE_LIMITED'
        else:
            return 'VERIFICATION_REQUIRED'
    
    def save_model(self, filepath="ml_models/clinic_risk_model.joblib"):
        """Save trained model to disk"""
        if self.model is None:
            print("❌ No model to save")
            return False
        
        try:
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'label_encoders': self.label_encoders,
                'feature_columns': self.feature_columns,
                'model_version': self.model_version,
                'training_date': datetime.now().isoformat()
            }
            
            joblib.dump(model_data, filepath)
            print(f"✅ Model saved to {filepath}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving model: {e}")
            return False
    
    def load_model(self, filepath="ml_models/clinic_risk_model.joblib"):
        """Load trained model from disk"""
        try:
            model_data = joblib.load(filepath)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.feature_columns = model_data['feature_columns']
            self.model_version = model_data.get('model_version', '1.0')
            
            print(f"✅ Model loaded from {filepath}")
            print(f"📊 Model version: {self.model_version}")
            print(f"📊 Training date: {model_data.get('training_date', 'Unknown')}")
            return True
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False

def main():
    """Main training and evaluation script"""
    print("🤖 Clinic Risk Assessment ML Model")
    print("=" * 50)
    
    # Initialize model
    risk_model = ClinicRiskModel()
    
    # Try to load existing model
    if not risk_model.load_model():
        print("🆕 Training new model...")
        # Train new model
        if risk_model.train_model():
            # Save trained model
            risk_model.save_model()
        else:
            print("❌ Model training failed")
            return
    
    # Example prediction
    print("\n🔮 Example Prediction:")
    example_clinic = {
        'clinic_name': 'Test Medical Center',
        'website': 'https://testmedical.com',
        'phone': '+1-555-0123-4567',
        'email': 'test@testmedical.com',
        'license_number': 'TEST-123456',
        'accreditation': 'Test Accreditation',
        'year_established': 2015,
        'number_of_doctors': 5,
        'number_of_staff': 10,
        'address': '123 Test St',
        'city': 'Test City',
        'state': 'Test State',
        'zip_code': '12345',
        'description': 'A comprehensive medical center providing quality healthcare services.'
    }
    
    prediction = risk_model.predict_risk(example_clinic)
    if prediction:
        print("📊 Prediction Result:")
        print(json.dumps(prediction, indent=2))
    else:
        print("❌ Prediction failed")

if __name__ == "__main__":
    main()
