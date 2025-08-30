import { Router, Request, Response } from 'express';
import { ComplianceChecker } from '../services/complianceChecker';
import { FeedbackHandler } from '../services/feedbackHandler';
import { DataHandler } from '../services/dataHandler';
import { 
  ComplianceCheckRequest, 
  ComplianceCheckResponse,
  FeedbackRequest,
  FeedbackResponse 
} from '../types';

const router = Router();
const complianceChecker = new ComplianceChecker();
const feedbackHandler = new FeedbackHandler();
const dataHandler = new DataHandler();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Regulium-Z Backend'
  });
});

// Get all laws
router.get('/laws', (req: Request, res: Response) => {
  try {
    const laws = dataHandler.getLaws();
    res.json({
      success: true,
      data: laws,
      count: laws.length
    });
  } catch (error) {
    console.error('Error fetching laws:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch laws'
    });
  }
});

// Get all features
router.get('/features', (req: Request, res: Response) => {
  try {
    const features = dataHandler.getFeatures();
    res.json({
      success: true,
      data: features,
      count: features.length
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch features'
    });
  }
});

// Get law by ID
router.get('/laws/:id', (req: Request, res: Response) => {
  try {
    const law = dataHandler.getLawById(req.params.id);
    if (!law) {
      return res.status(404).json({
        success: false,
        error: 'Law not found'
      });
    }
    res.json({
      success: true,
      data: law
    });
  } catch (error) {
    console.error('Error fetching law:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch law'
    });
  }
});

// Get feature by ID
router.get('/features/:id', (req: Request, res: Response) => {
  try {
    const feature = dataHandler.getFeatureById(req.params.id);
    if (!feature) {
      return res.status(404).json({
        success: false,
        error: 'Feature not found'
      });
    }
    res.json({
      success: true,
      data: feature
    });
  } catch (error) {
    console.error('Error fetching feature:', error);
    res.status(500).json({
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
    
    const result: ComplianceCheckResponse = await complianceChecker.checkCompliance(request);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in compliance check:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform compliance check'
    });
  }
});

// Submit feedback endpoint
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const feedback: FeedbackRequest = req.body;
    
    // Validate request
    if (!feedback || !feedback.feature_id || !feedback.law_id || !feedback.message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: feature_id, law_id, and message are required'
      });
    }

    const result: FeedbackResponse = await feedbackHandler.submitFeedback(feedback);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get all feedback
router.get('/feedback', (req: Request, res: Response) => {
  try {
    const feedback = feedbackHandler.getFeedback();
    res.json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// Get feedback by feature
router.get('/feedback/feature/:featureId', (req: Request, res: Response) => {
  try {
    const feedback = feedbackHandler.getCorrectionsByFeature(req.params.featureId);
    res.json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback by feature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// Get feedback by law
router.get('/feedback/law/:lawId', (req: Request, res: Response) => {
  try {
    const feedback = feedbackHandler.getCorrectionsByLaw(req.params.lawId);
    res.json({
      success: true,
      data: feedback,
      count: feedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback by law:', error);
    res.status(500).json({
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

    const success = feedbackHandler.updateCorrectionStatus(req.params.feedbackId, status);
    
    if (success) {
      res.json({
        success: true,
        message: 'Feedback status updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Feedback not found or update failed'
      });
    }
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback status'
    });
  }
});

// Delete feedback
router.delete('/feedback/:feedbackId', (req: Request, res: Response) => {
  try {
    const success = feedbackHandler.deleteCorrection(req.params.feedbackId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Feedback not found or deletion failed'
      });
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback'
    });
  }
});

// Refresh data endpoint
router.post('/data/refresh', async (req: Request, res: Response) => {
  try {
    await complianceChecker.refreshData();
    res.json({
      success: true,
      message: 'Data refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh data'
    });
  }
});

export default router;
