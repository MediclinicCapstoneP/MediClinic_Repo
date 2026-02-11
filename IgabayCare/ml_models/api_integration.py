"""
API Integration for Clinic Risk Assessment ML Model
Provides REST API endpoints for risk assessment predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import logging
import os
from datetime import datetime
from clinic_risk_model import ClinicRiskModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the trained model
model = ClinicRiskModel()
model_loaded = False

def load_model():
    """Load the trained model on startup"""
    global model_loaded
    try:
        model_path = os.environ.get('MODEL_PATH', 'clinic_risk_model.joblib')
        if model.load_model(model_path):
            model_loaded = True
            logger.info(f"Model loaded successfully from {model_path}")
        else:
            logger.error("Failed to load model")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model_loaded = False

# Load model on startup
load_model()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat(),
        'model_version': model.model_version if model_loaded else None
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
        # Get clinic data from request
        clinic_data = request.get_json()
        
        if not clinic_data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Clinic data is required'
            }), 400

        # Validate required fields
        required_fields = ['clinic_name', 'email']
        missing_fields = [field for field in required_fields if field not in clinic_data]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400

        # Make prediction
        logger.info(f"🔮 Making risk assessment for clinic: {clinic_data.get('clinic_name', 'Unknown')}")
        
        result = model.predict_risk(clinic_data)
        
        if result is None:
            return jsonify({
                'error': 'Prediction failed',
                'message': 'Unable to complete risk assessment'
            }), 500

        # Add metadata
        result['api_version'] = '1.0'
        result['processing_time_ms'] = 0  # TODO: Add timing
        result['request_id'] = f"req_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]}"
        
        logger.info(f"✅ Risk assessment completed: {result['risk_level']} ({result['risk_score']:.3f})")
        
        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        logger.error(f"❌ Error in risk assessment: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/batch-assess', methods=['POST'])
def batch_assess_risk():
    """Batch risk assessment for multiple clinics"""
    if not model_loaded:
        return jsonify({
            'error': 'Model not loaded',
            'message': 'Risk assessment service is currently unavailable'
        }), 503

    try:
        data = request.get_json()
        clinics = data.get('clinics', [])
        
        if not clinics:
            return jsonify({
                'error': 'No clinics provided',
                'message': 'Clinics array is required'
            }), 400

        if len(clinics) > 100:
            return jsonify({
                'error': 'Too many clinics',
                'message': 'Maximum 100 clinics per batch'
            }), 400

        results = []
        errors = []
        
        for i, clinic_data in enumerate(clinics):
            try:
                result = model.predict_risk(clinic_data)
                if result:
                    result['batch_index'] = i
                    results.append(result)
                else:
                    errors.append({
                        'batch_index': i,
                        'error': 'Prediction failed',
                        'clinic_name': clinic_data.get('clinic_name', 'Unknown')
                    })
            except Exception as e:
                errors.append({
                    'batch_index': i,
                    'error': str(e),
                    'clinic_name': clinic_data.get('clinic_name', 'Unknown')
                })

        logger.info(f"📊 Batch assessment completed: {len(results)} successful, {len(errors)} failed")
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'errors': errors,
                'summary': {
                    'total_processed': len(clinics),
                    'successful': len(results),
                    'failed': len(errors)
                }
            }
        })

    except Exception as e:
        logger.error(f"❌ Error in batch assessment: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information and statistics"""
    if not model_loaded:
        return jsonify({
            'error': 'Model not loaded'
        }), 503

    try:
        info = {
            'model_version': model.model_version,
            'feature_columns': model.feature_columns,
            'model_type': 'ensemble',
            'algorithms_tested': ['RandomForest', 'GradientBoosting', 'LogisticRegression'],
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
                'business_maturity',
                'scale_analysis'
            ]
        }
        
        return jsonify({
            'success': True,
            'data': info
        })

    except Exception as e:
        logger.error(f"❌ Error getting model info: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/validate-clinic-data', methods=['POST'])
def validate_clinic_data():
    """Validate clinic data format and required fields"""
    try:
        clinic_data = request.get_json()
        
        if not clinic_data:
            return jsonify({
                'valid': False,
                'errors': ['No data provided']
            })

        validation_errors = []
        warnings = []

        # Check required fields
        required_fields = ['clinic_name', 'email']
        for field in required_fields:
            if not clinic_data.get(field):
                validation_errors.append(f'Missing required field: {field}')

        # Validate email format
        email = clinic_data.get('email', '')
        if '@' not in email:
            validation_errors.append('Invalid email format')

        # Validate phone format if provided
        phone = clinic_data.get('phone', '')
        if phone and not phone.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            warnings.append('Phone format may be invalid')

        # Validate year established
        year = clinic_data.get('year_established')
        if year and (year < 1900 or year > datetime.now().year):
            validation_errors.append('Year established must be between 1900 and current year')

        return jsonify({
            'valid': len(validation_errors) == 0,
            'errors': validation_errors,
            'warnings': warnings,
            'field_count': len([k for k, v in clinic_data.items() if v is not None])
        })

    except Exception as e:
        logger.error(f"❌ Error validating data: {e}")
        return jsonify({
            'valid': False,
            'errors': [str(e)]
        })

@app.route('/reload-model', methods=['POST'])
def reload_model():
    """Reload the model (for admin use)"""
    try:
        global model_loaded
        old_version = model.model_version if model_loaded else None
        
        if load_model():
            return jsonify({
                'success': True,
                'message': 'Model reloaded successfully',
                'old_version': old_version,
                'new_version': model.model_version
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to reload model'
            }), 500

    except Exception as e:
        logger.error(f"❌ Error reloading model: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist',
        'available_endpoints': [
            'GET /health',
            'POST /assess-risk',
            'POST /batch-assess',
            'GET /model-info',
            'POST /validate-clinic-data',
            'POST /reload-model'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"🚀 Starting Clinic Risk Assessment API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
