import React, { useState, useEffect } from 'react';
import { Shield, Zap, BarChart3, MessageSquare, Loader2, AlertCircle, RefreshCw, History } from 'lucide-react';
import ComplianceTable from '../components/ComplianceTable';
import FeedbackChatbox from '../components/FeedbackChatbox';
import { 
  ComplianceResult, 
  SingleFeatureComplianceRequest,
  FeedbackRequest,
  Feature,
  Law 
} from '../types/api';

const MainPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([]);
  const [complianceSummary, setComplianceSummary] = useState<any>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [laws, setLaws] = useState<Law[]>([]);
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [includeAbbreviations, setIncludeAbbreviations] = useState(true);
  const [includeCorrections, setIncludeCorrections] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadFeatures();
    loadLaws();
  }, []);

  const loadFeatures = async () => {
    try {
      console.log('Loading features...');
      const response = await fetch('/api/features');
      console.log('Features response:', response);
      const data = await response.json();
      console.log('Features data:', data);
      if (data.success) {
        setFeatures(data.data);
        console.log('Features loaded successfully:', data.data.length);
      }
    } catch (error) {
      console.error('Error loading features:', error);
      setError('Failed to load features');
    }
  };

  const loadLaws = async () => {
    try {
      console.log('Loading laws...');
      const response = await fetch('/api/laws');
      console.log('Laws response:', response);
      const data = await response.json();
      console.log('Laws data:', data);
      if (data.success) {
        setLaws(data.data);
        console.log('Laws loaded successfully:', data.data.length);
      }
    } catch (error) {
      console.error('Error loading laws:', error);
      setError('Failed to load laws');
    }
  };

  const handleComplianceCheck = async () => {
    if (!featureTitle.trim() || !featureDescription.trim()) {
      setError('Please fill in both Feature Title and Feature Description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting compliance check for new feature:', { featureTitle, featureDescription });

      // First, add the feature to CSV
      console.log('Adding feature to CSV...');
      const addFeatureResponse = await fetch('/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_name: featureTitle.trim(),
          feature_description: featureDescription.trim()
        }),
      });

      const addFeatureData = await addFeatureResponse.json();
      if (!addFeatureData.success) {
        throw new Error(addFeatureData.error || 'Failed to add feature to CSV');
      }
      console.log('Feature added to CSV successfully');

      // Then, check compliance against all laws
      console.log('Checking compliance against all laws...');
      const complianceRequest: SingleFeatureComplianceRequest = {
        feature_name: featureTitle.trim(),
        feature_description: featureDescription.trim(),
        include_abbreviations: includeAbbreviations,
        include_corrections: includeCorrections
      };

      const complianceResponse = await fetch('/api/compliance/check-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complianceRequest),
      });

      const complianceData = await complianceResponse.json();

      if (complianceData.success) {
        console.log('Compliance check completed successfully');
        setComplianceResults(complianceData.data.results);
        setComplianceSummary(complianceData.data.summary);
        
        // Clear the input fields after successful submission
        setFeatureTitle('');
        setFeatureDescription('');
      } else {
        throw new Error(complianceData.error || 'Compliance check failed');
      }
    } catch (error) {
      console.error('Error during compliance check:', error);
      setError(error instanceof Error ? error.message : 'Failed to perform compliance check. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackClick = (result: ComplianceResult) => {
    setSelectedResult(result);
    setIsFeedbackOpen(true);
  };

  const handleSubmitFeedback = async (feedback: FeedbackRequest): Promise<void> => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const handleSyncLaws = () => {
    console.log('Sync Laws button clicked - placeholder functionality');
    // TODO: Implement sync laws functionality
  };

  const handleCheckHistory = () => {
    console.log('Check History button clicked - placeholder functionality');
    // TODO: Implement check history functionality
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Regulium-Z</h1>
                <p className="text-sm text-gray-500">AI-Powered Compliance Checking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-danger-600" />
              <span className="text-danger-800 font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-danger-600 hover:text-danger-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Configuration Section */}
        <div className="card mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Zap className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Compliance Check Configuration</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Feature Input Fields */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">New Feature Details</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="featureTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Feature Title *
                  </label>
                  <input
                    id="featureTitle"
                    type="text"
                    value={featureTitle}
                    onChange={(e) => setFeatureTitle(e.target.value)}
                    placeholder="Enter feature title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="featureDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Feature Description *
                  </label>
                  <textarea
                    id="featureDescription"
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    placeholder="Enter feature description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Placeholder Buttons */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={handleSyncLaws}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Sync Laws</span>
                </button>
                <button
                  onClick={handleCheckHistory}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <History className="w-5 h-5" />
                  <span>Check History</span>
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeAbbreviations}
                  onChange={(e) => setIncludeAbbreviations(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Include abbreviations context</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeCorrections}
                  onChange={(e) => setIncludeCorrections(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Include previous corrections</span>
              </label>
            </div>
          </div>

          {/* Check Compliance Button */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={handleComplianceCheck}
              disabled={isLoading || !featureTitle.trim() || !featureDescription.trim()}
              className="btn btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Checking Compliance...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Check Compliance
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {complianceResults.length > 0 && complianceSummary && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Compliance Results</h2>
            </div>
            
            <ComplianceTable
              results={complianceResults}
              summary={complianceSummary}
              onFeedbackClick={handleFeedbackClick}
            />
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && complianceResults.length === 0 && !error && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Compliance Results Yet</h3>
            <p className="text-gray-500">
              Enter a new feature above and click "Check Compliance" to get started.
            </p>
          </div>
        )}
      </div>

      {/* Feedback Chatbox */}
      <FeedbackChatbox
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        result={selectedResult}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
};

export default MainPage;
