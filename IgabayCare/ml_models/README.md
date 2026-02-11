# Clinic Risk Assessment ML Models

This directory contains Python machine learning models for clinic risk assessment using behavioral metrics and clinic metadata.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ml_models
pip install -r requirements.txt
```

### 2. Create Sample Data and Train Model

```bash
# Create sample behavioral data and train
python train_model.py --create-sample

# Or use your own data
python train_model.py --data-path path/to/your/behavior_metrics.csv
```

### 3. Use the Model

```python
from clinic_risk_model import ClinicRiskModel

# Load trained model
model = ClinicRiskModel()
model.load_model()

# Predict risk for new clinic
clinic_data = {
    'clinic_name': 'Test Medical Center',
    'website': 'https://testmedical.com',
    'phone': '+1-555-0123-4567',
    'license_number': 'TEST-123456',
    'year_established': 2015,
    'number_of_doctors': 5,
    # ... other fields
}

result = model.predict_risk(clinic_data)
print(result)
```

## 📊 Data Requirements

### Behavioral Metrics CSV Format

The model expects behavioral metrics with the following columns:

**Required Columns:**
- `clinic_id` - Unique identifier
- `submission_timestamp` - When clinic was registered
- `risk_score` - Historical risk scores (for supervised learning)
- `risk_level` - Risk level labels (LOW/MEDIUM/HIGH)

**Optional Behavioral Columns:**
- `login_frequency` - How often clinic logs in
- `profile_completion_time` - Time to complete registration (seconds)
- `data_modification_count` - Number of profile changes
- `session_duration_avg` - Average session length (seconds)
- `time_to_first_appointment` - Time to first appointment (seconds)
- `support_ticket_count` - Number of support tickets
- `document_upload_count` - Number of documents uploaded
- `profile_view_count` - Profile view frequency
- `complaint_count` - Number of complaints
- `is_fraud_reported` - Fraud reports (0/1)
- `manual_review_required` - Manual review flag (0/1)

**Clinic Information Columns:**
- `clinic_name` - Clinic name
- `website` - Website URL
- `phone` - Phone number
- `email` - Email address
- `license_number` - Medical license number
- `accreditation` - Accreditation details
- `tax_id` - Tax identification
- `year_established` - Year business was established
- `number_of_doctors` - Number of doctors
- `number_of_staff` - Number of staff
- `address`, `city`, `state`, `zip_code` - Location info
- `latitude`, `longitude` - Coordinates
- `description` - Clinic description

## 🤖 Model Architecture

### Feature Engineering

The model extracts 30+ features across these categories:

1. **Submission Patterns**
   - Time of day, day of week
   - Business hours vs weekend submission
   - Late night submissions

2. **Business Legitimacy**
   - Website presence and domain analysis
   - Phone format validation
   - License format validation
   - Accreditation status
   - Tax ID format validation

3. **Business Maturity**
   - Years in business
   - New vs established business

4. **Scale Analysis**
   - Number of doctors and staff
   - Solo practice vs large clinic
   - Staff-to-doctor ratios

5. **Data Completeness**
   - Address completeness score
   - Required fields presence
   - Profile completion metrics

6. **Service Diversity**
   - Number of specialties and services
   - Custom vs standard offerings
   - Specialty diversity score

7. **Behavioral Patterns**
   - Login frequency and patterns
   - Session duration
   - Profile modification frequency
   - Support interactions

8. **Text Quality**
   - Description length and quality
   - Medical terminology usage

### Model Selection

The system automatically evaluates multiple algorithms:

- **Random Forest** - Best for interpretability and feature importance
- **Gradient Boosting** - Best for predictive performance
- **Logistic Regression** - Best for baseline comparison

The best performing model (based on cross-validation) is selected automatically.

## 📈 Model Performance

### Metrics Tracked

- **Accuracy** - Overall prediction accuracy
- **F1-Score** - Weighted F1 for imbalanced classes
- **ROC-AUC** - Area under ROC curve
- **Feature Importance** - Most predictive features

### Expected Performance

With quality training data:
- **Accuracy**: 85-92%
- **F1-Score**: 0.80-0.90
- **ROC-AUC**: 0.88-0.95

## 🔧 Model Training

### Command Line Options

```bash
python train_model.py [options]

Options:
  --data-path PATH       Path to behavioral metrics CSV file
  --create-sample        Create sample data for training
  --analyze-only        Only analyze data, don't train model
```

### Training Process

1. **Data Loading** - Load behavioral metrics and clinic data
2. **Feature Engineering** - Extract 30+ features
3. **Data Preprocessing** - Handle categorical variables, scaling
4. **Model Selection** - Try multiple algorithms
5. **Cross-Validation** - 5-fold CV for robust evaluation
6. **Feature Analysis** - Show most important features
7. **Model Saving** - Persist best model with metadata

### Output Files

- `clinic_risk_model.joblib` - Trained model file
- `data_analysis.png` - Data visualization plots
- `correlation_matrix.png` - Feature correlation heatmap

## 🎯 Risk Assessment Output

```json
{
  "risk_score": 0.25,
  "risk_level": "LOW",
  "account_status": "ACTIVE_LIMITED",
  "risk_flags": [],
  "confidence": 0.87,
  "model_version": "2.0",
  "prediction_timestamp": "2024-02-10T15:30:00Z"
}
```

### Risk Levels

- **LOW (0.0-0.3)**: Low risk, full functionality
- **MEDIUM (0.3-0.7)**: Medium risk, verification required
- **HIGH (0.7-1.0)**: High risk, restricted access

### Account Statuses

- **ACTIVE_LIMITED**: Can accept appointments, visible in search
- **VERIFICATION_REQUIRED**: Limited access, verification needed
- **RESTRICTED**: All functionality restricted

## 🔄 Model Retraining

### When to Retrain

- Monthly with new behavioral data
- When performance metrics drop
- After major system changes
- When new fraud patterns emerge

### Automated Retraining

```bash
# Setup cron job for monthly retraining
0 0 1 * * cd /path/to/ml_models && python train_model.py --data-path /path/to/latest/behavior_metrics.csv
```

## 📊 Model Monitoring

### Key Metrics to Track

1. **Prediction Distribution**
   - Risk level percentages
   - Score distribution changes

2. **Model Drift**
   - Feature distribution changes
   - Prediction confidence trends

3. **Business Impact**
   - Fraud detection rate
   - False positive rate
   - User feedback on assessments

### Monitoring Dashboard

Create a simple dashboard to track:
- Daily prediction counts by risk level
- Model confidence trends
- Feature importance changes
- User appeal rates

## 🔒 Security & Compliance

### Data Privacy

- **No PHI**: Only uses behavioral and business metadata
- **Encrypted Storage**: Model files encrypted at rest
- **Access Logs**: All model accesses logged
- **Data Retention**: Follow data retention policies

### Model Governance

- **Version Control**: All model versions tracked
- **Audit Trail**: Complete training and deployment logs
- **Explainability**: Feature importance and decision logic
- **Fairness**: Regular bias audits

## 🚀 Deployment

### Production Integration

1. **Model Loading**: Load trained model in application
2. **Feature Extraction**: Use same feature engineering pipeline
3. **Prediction Service**: REST API for risk assessment
4. **Caching**: Cache predictions for performance
5. **Monitoring**: Track prediction quality and drift

### API Integration

```python
# Flask API example
from flask import Flask, request, jsonify
from clinic_risk_model import ClinicRiskModel

app = Flask(__name__)
model = ClinicRiskModel()
model.load_model()

@app.route('/assess-risk', methods=['POST'])
def assess_risk():
    clinic_data = request.json
    result = model.predict_risk(clinic_data)
    return jsonify(result)
```

## 🐛 Troubleshooting

### Common Issues

1. **Model Not Loading**
   - Check model file path
   - Verify joblib version compatibility
   - Check file permissions

2. **Poor Performance**
   - Inspect training data quality
   - Check feature engineering consistency
   - Verify label quality

3. **Feature Mismatch**
   - Ensure training and prediction features match
   - Check categorical encoding consistency
   - Verify data preprocessing steps

### Debug Mode

```python
# Enable detailed logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Analyze feature extraction
model = ClinicRiskModel()
df = pd.read_csv('your_data.csv')
features = model.engineer_features(df)
print(features.head())
```

## 📚 References

- [scikit-learn Documentation](https://scikit-learn.org/)
- [Pandas Documentation](https://pandas.pydata.org/)
- [Machine Learning Best Practices](https://scikit-learn.org/stable/user_guide.html)

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Add unit tests for new features
3. Update documentation for API changes
4. Test with sample data before deployment
