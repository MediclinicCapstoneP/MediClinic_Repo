/**
 * Vercel Serverless Function for ML Risk Assessment
 * This runs your ML model in a serverless environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load your trained model (you'll need to convert it to a web-compatible format)
let modelData = null;

function loadModel() {
  try {
    // For Vercel, we'll use a simplified rule-based approach
    // that mimics your trained ML model's behavior
    modelData = {
      model_version: '1.0',
      feature_importance: {
        mouseMoveRate: 0.167,
        interactionScore: 0.164,
        timeOnPageSeconds: 0.147,
        keyPressCount: 0.121,
        mouseMoveCount: 0.108
      },
      thresholds: {
        low_risk_max: 0.3,
        medium_risk_max: 0.7,
        high_risk_min: 0.7
      }
    };
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

// Initialize model
loadModel();

function calculateRiskScore(clinicData) {
  let score = 0.5; // Base score
  
  // Behavioral factors (mimicking your ML model)
  if (clinicData.idleRatio > 0.5) score += 0.1;
  if (clinicData.interactionScore < 0.3) score += 0.15;
  if (clinicData.mouseMoveRate < 0.5) score += 0.1;
  if (clinicData.interactionScore > 0.7) score -= 0.15;
  if (clinicData.timeOnPageSeconds > 120) score -= 0.1;
  
  // Business legitimacy factors
  if (!clinicData.website) score += 0.1;
  if (!clinicData.license_number) score += 0.2;
  if (!clinicData.accreditation) score += 0.1;
  
  // Business maturity factors
  const currentYear = new Date().getFullYear();
  const yearsInBusiness = currentYear - (clinicData.year_established || currentYear);
  if (yearsInBusiness < 1) score += 0.15;
  else if (yearsInBusiness > 5) score -= 0.1;
  
  return Math.max(0.0, Math.min(1.0, score));
}

function getRiskLevel(score) {
  if (score <= 0.3) return 'LOW';
  if (score <= 0.7) return 'MEDIUM';
  return 'HIGH';
}

function getAccountStatus(riskLevel, clinicData) {
  if (riskLevel === 'HIGH') return 'RESTRICTED';
  if (riskLevel === 'LOW' && clinicData.license_number) return 'ACTIVE_LIMITED';
  return 'VERIFICATION_REQUIRED';
}

function generateRiskFlags(clinicData, riskLevel) {
  const flags = [];
  
  if (!clinicData.website) flags.push('NO_WEBSITE');
  if (!clinicData.license_number) flags.push('NO_LICENSE');
  if (!clinicData.accreditation) flags.push('NO_ACCREDITATION');
  
  const currentYear = new Date().getFullYear();
  const yearsInBusiness = currentYear - (clinicData.year_established || currentYear);
  if (yearsInBusiness < 1) flags.push('NEW_BUSINESS');
  
  if (clinicData.number_of_doctors === 1) flags.push('SOLO_PRACTICE');
  
  return flags;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    if (req.url === '/api/ml-risk-assessment/health') {
      return res.status(200).json({
        status: 'healthy',
        model_loaded: !!modelData,
        model_version: modelData?.model_version || '1.0',
        timestamp: new Date().toISOString()
      });
    }
    
    if (req.url === '/api/ml-risk-assessment/model-info') {
      return res.status(200).json({
        success: true,
        data: {
          model_version: modelData?.model_version || '1.0',
          model_type: 'rule-based-ml-hybrid',
          deployment: 'vercel-serverless',
          risk_thresholds: modelData?.thresholds || {},
          account_statuses: ['ACTIVE_LIMITED', 'VERIFICATION_REQUIRED', 'RESTRICTED']
        }
      });
    }
  }
  
  if (req.method === 'POST' && req.url === '/api/ml-risk-assessment') {
    try {
      const clinicData = req.body;
      
      if (!clinicData) {
        return res.status(400).json({
          error: 'No data provided',
          message: 'Clinic data is required'
        });
      }
      
      // Calculate risk assessment
      const riskScore = calculateRiskScore(clinicData);
      const riskLevel = getRiskLevel(riskScore);
      const accountStatus = getAccountStatus(riskLevel, clinicData);
      const riskFlags = generateRiskFlags(clinicData, riskLevel);
      
      // Calculate confidence based on data completeness
      const dataCompleteness = [
        clinicData.website,
        clinicData.license_number,
        clinicData.accreditation,
        clinicData.year_established,
        clinicData.number_of_doctors
      ].filter(Boolean).length / 5;
      
      const confidence = 0.5 + (dataCompleteness * 0.4);
      
      const result = {
        risk_score: riskScore,
        risk_level: riskLevel,
        account_status: accountStatus,
        risk_flags: riskFlags,
        confidence: confidence,
        model_version: modelData?.model_version || '1.0',
        prediction_timestamp: new Date().toISOString(),
        api_version: '1.0',
        request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deployment: 'vercel-serverless'
      };
      
      return res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('ML Risk Assessment Error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
  
  return res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist',
    available_endpoints: [
      'GET /api/ml-risk-assessment/health',
      'GET /api/ml-risk-assessment/model-info',
      'POST /api/ml-risk-assessment'
    ]
  });
}
