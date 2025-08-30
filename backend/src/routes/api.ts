import { Router, Request, Response } from 'express';
import { ComplianceChecker } from '../services/complianceChecker';
import { FeedbackHandler } from '../services/feedbackHandler';
import { DataHandler } from '../services/dataHandler';
import { getCSVPath } from '../utils/pathUtils';
import { 
  ComplianceCheckRequest, 
  ComplianceCheckResponse,
  FeedbackRequest,
  FeedbackResponse 
} from '../types';
import { Feature, ComplianceResult } from '../types'; // Added missing imports

const router = Router();

// Lazy-load services to avoid instantiation before environment variables are loaded
let complianceChecker: ComplianceChecker | null = null;
let feedbackHandler: FeedbackHandler | null = null;
let dataHandler: DataHandler | null = null;

const getComplianceChecker = () => {
  if (!complianceChecker) {
    complianceChecker = new ComplianceChecker();
  }
  return complianceChecker;
};

const getFeedbackHandler = () => {
  if (!feedbackHandler) {
    feedbackHandler = new FeedbackHandler();
  }
  return feedbackHandler;
};

const getDataHandler = () => {
  if (!dataHandler) {
    dataHandler = new DataHandler();
  }
  return dataHandler;
};

// Helper function to ensure data is ready
const ensureDataReady = async () => {
  const handler = getDataHandler();
  if (!handler.isReady()) {
    await handler.waitForReady();
  }
  return handler;
};

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const handler = await ensureDataReady();
    const fs = require('fs');
    
    // Use shared path utility function
    const lawsPath = getCSVPath('laws.csv');
    const featuresPath = getCSVPath('features.csv');
    
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Regulium-Z Backend',
      dataReady: handler.isReady(),
      lawsCount: handler.getLaws().length,
      featuresCount: handler.getFeatures().length,
      handlerCreated: !!handler,
      handlerType: handler.constructor.name,
      lawsPath: lawsPath,
      featuresPath: featuresPath,
      lawsExists: fs.existsSync(lawsPath),
      featuresExists: fs.existsSync(featuresPath),
      lawsSize: fs.existsSync(lawsPath) ? fs.statSync(lawsPath).size : 0,
      featuresSize: fs.existsSync(featuresPath) ? fs.statSync(featuresPath).size : 0
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get all laws
router.get('/laws', async (req: Request, res: Response) => {
  try {
    const handler = await ensureDataReady();
    const laws = handler.getLaws();
    return res.json({
      success: true,
      data: laws,
      count: laws.length
    });
  } catch (error) {
    console.error('Error fetching laws:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch laws'
    });
  }
});

// Get all features
router.get('/features', async (req: Request, res: Response) => {
  try {
    const handler = await ensureDataReady();
    const features = handler.getFeatures();
    return res.json({
      success: true,
      data: features,
      count: features.length
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch features'
    });
  }
});

// Add new feature endpoint
router.post('/features', async (req: Request, res: Response) => {
  try {
    const { feature_name, feature_description } = req.body;
    
    // Validate request
    if (!feature_name || !feature_description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: feature_name and feature_description are required'
      });
    }

    console.log('Adding new feature:', { feature_name, feature_description });
    
    // Add feature to CSV
    const success = await getDataHandler().addFeature(feature_name, feature_description);
    
    if (success) {
      console.log('Feature added successfully to CSV');
      return res.status(201).json({
        success: true,
        message: 'Feature added successfully',
        data: { feature_name, feature_description }
      });
    } else {
      console.error('Failed to add feature to CSV');
      return res.status(500).json({
        success: false,
        error: 'Failed to add feature to CSV'
      });
    }
  } catch (error) {
    console.error('Error adding feature:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add feature'
    });
  }
});

// Get law by title
router.get('/laws/:title', async (req: Request, res: Response) => {
  try {
    const handler = await ensureDataReady();
    const law = handler.getLawByTitle(req.params.title);
    if (!law) {
      return res.status(404).json({
        success: false,
        error: 'Law not found'
      });
    }
    return res.json({
      success: true,
      data: law
    });
  } catch (error) {
    console.error('Error fetching law:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch law'
    });
  }
});

// Get feature by name
router.get('/features/:name', async (req: Request, res: Response) => {
  try {
    const handler = await ensureDataReady();
    const feature = handler.getFeatureByName(req.params.name);
    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }
    return res.json({
      success: true,
      data: feature
    });
  } catch (error) {
    console.error('Error fetching feature:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch feature'
    });
  }
});

// Main compliance check endpoint
router.post('/compliance/check', async (req: Request, res: Response) => {
  try {
    const request: ComplianceCheckRequest = req.body;
    
    // Validate request
    if (!request) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    console.log('Starting compliance check with request:', request);
    
    const result: ComplianceCheckResponse = await getComplianceChecker().checkCompliance(request);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in compliance check:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform compliance check'
    });
  }
});

// Check compliance of single feature against all laws
router.post('/compliance/check-feature', async (req: Request, res: Response) => {
  try {
    const { feature_name, feature_description } = req.body;
    
    if (!feature_name || !feature_description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: feature_name and feature_description are required' 
      });
    }

    console.log(`Starting compliance check for feature: ${feature_name}`);
    
    // Create a temporary feature object for compliance checking
    const tempFeature: Feature = {
      feature_name,
      feature_description
    };

    // Get all laws and features
    const allLaws = getDataHandler().getLaws();
    const allFeatures = getDataHandler().getFeatures();
    
    console.log(`Total laws available: ${allLaws.length}`);
    console.log(`Total features available: ${allFeatures.length}`);

    // Step 1: Screen laws for relevance
    console.log('Step 1: Screening laws for relevance...');
    const complianceChecker = getComplianceChecker();
    const relevantLawTitles = await complianceChecker.screenLawsForRelevance(tempFeature, allLaws);
    
    if (relevantLawTitles.length === 0) {
      console.log('No relevant laws found for this feature');
      return res.json({
        success: true,
        data: {
          results: [],
          summary: {
            total_features: 1,
            total_laws: allLaws.length,
            relevant_laws: 0,
            compliant_count: 0,
            non_compliant_count: 0,
            review_required_count: 0,
            overall_risk_score: 0
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // Step 2: Filter laws to only relevant ones
    const relevantLaws = allLaws.filter(law => relevantLawTitles.includes(law.law_title));
    console.log(`Step 2: Found ${relevantLaws.length} relevant laws for compliance checking`);

    // Step 3: Check compliance against relevant laws only
    console.log('Step 3: Checking compliance against relevant laws...');
    const results: ComplianceResult[] = [];
    
    for (const law of relevantLaws) {
      try {
        console.log(`Checking compliance for ${tempFeature.feature_name} against ${law.law_title}`);
        const complianceRequest = {
          include_abbreviations: true,
          include_corrections: true
        };
        const result = await complianceChecker.checkFeatureCompliance(tempFeature, law, complianceRequest);
        results.push(result);
      } catch (error) {
        console.error(`Error checking compliance for feature ${tempFeature.feature_name} against law ${law.law_title}:`, error);
        
        // Add fallback result for this law
        results.push({
          feature_name: tempFeature.feature_name,
          law_title: law.law_title,
          law_description: law.law_description,
          compliance_status: "requires_review",
          reasoning: "Error occurred during compliance check. Manual review required.",
          recommendations: ["Review the feature implementation manually", "Check system logs for errors"]
        });
      }
    }

    // Calculate summary statistics
    const compliantCount = results.filter(r => r.compliance_status === "compliant").length;
    const nonCompliantCount = results.filter(r => r.compliance_status === "non-compliant").length;
    const reviewRequiredCount = results.filter(r => r.compliance_status === "requires_review").length;
    
    const overallRiskScore = Math.round(
      ((nonCompliantCount * 100) + (reviewRequiredCount * 50)) / relevantLaws.length
    );

    console.log('Compliance check completed successfully');
    console.log(`Results: ${compliantCount} compliant, ${nonCompliantCount} non-compliant, ${reviewRequiredCount} need review`);
    console.log(`Overall risk score: ${overallRiskScore}`);

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total_features: 1,
          total_laws: allLaws.length,
          relevant_laws: relevantLaws.length,
          compliant_count: compliantCount,
          non_compliant_count: nonCompliantCount,
          review_required_count: reviewRequiredCount,
          overall_risk_score: overallRiskScore
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in compliance check:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error during compliance check' 
    });
  }
});

// Submit feedback endpoint
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const feedback: FeedbackRequest = req.body;
    
    // Validate request
    if (!feedback || !feedback.feature_name || !feedback.law_title || !feedback.message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: feature_name, law_title, and message are required'
      });
    }

    const result: FeedbackResponse = await getFeedbackHandler().submitFeedback(feedback);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get all feedback
router.get('/feedback', (req: Request, res: Response) => {
  try {
    const feedback = getFeedbackHandler().getFeedback();
    return res.json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// Get feedback by feature
router.get('/feedback/feature/:featureName', (req: Request, res: Response) => {
  try {
    const feedback = getFeedbackHandler().getCorrectionsByFeature(req.params.featureName);
    return res.json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback by feature:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// Get feedback by law
router.get('/feedback/law/:lawTitle', (req: Request, res: Response) => {
  try {
    const feedback = getFeedbackHandler().getCorrectionsByLaw(req.params.lawTitle);
    return res.json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback by law:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// Update feedback status
router.patch('/feedback/:feedbackId/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'reviewed', 'implemented'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required: pending, reviewed, or implemented'
      });
    }

    const success = getFeedbackHandler().updateCorrectionStatus(req.params.feedbackId, status);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Feedback status updated successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found or update failed'
      });
    }
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update feedback status'
    });
  }
});

// Delete feedback
router.delete('/feedback/:feedbackId', (req: Request, res: Response) => {
  try {
    const success = getFeedbackHandler().deleteCorrection(req.params.feedbackId);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found or deletion failed'
      });
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete feedback'
    });
  }
});

// Refresh data endpoint
router.post('/data/refresh', async (req: Request, res: Response) => {
  try {
    await getComplianceChecker().refreshData();
    return res.json({
      success: true,
      message: 'Data refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh data'
    });
  }
});

export default router;
