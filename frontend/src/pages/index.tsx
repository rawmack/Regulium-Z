import React, { useState, useEffect } from 'react';
import { Shield, Zap, BarChart3, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import ComplianceTable from '../components/ComplianceTable';
import FeedbackChatbox from '../components/FeedbackChatbox';
import { 
  ComplianceResult, 
  ComplianceCheckRequest, 
  ComplianceCheckResponse,
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
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedLaws, setSelectedLaws] = useState<string[]>([]);
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
      const response = await fetch('/api/features');
      const data = await response.json();
      if (data.success) {
        setFeatures(data.data);
        // Select all features by default
        setSelectedFeatures(data.data.map((f: Feature) => f.feature_id));
      }
    } catch (error) {
      console.error('Error loading features:', error);
      setError('Failed to load features');
    }
  };

  const loadLaws = async () => {
    try {
      const response = await fetch('/api/laws');
      const data = await response.json();
      if (data.success) {
        setLaws(data.data);
        // Select all laws by default
        setSelectedLaws(data.data.map((l: Law) => l.law_id));
      }
    } catch (error) {
      console.error('Error loading laws:', error);
      setError('Failed to load laws');
    }
  };

  const handleComplianceCheck = async () => {
    if (selectedFeatures.length === 0 || selectedLaws.length === 0) {
      setError('Please select at least one feature and one law');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: ComplianceCheckRequest = {
        features: selectedFeatures,
        laws: selectedLaws,
        include_abbreviations: includeAbbreviations,
        include_corrections: includeCorrections
      };

      const response = await fetch('/api/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        setComplianceResults(data.data.results);
        setComplianceSummary(data.data.summary);
      } else {
        setError(data.error || 'Compliance check failed');
      }
    } catch (error) {
      console.error('Error during compliance check:', error);
      setError('Failed to perform compliance check. Please try again.');
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

  const handleSelectAllFeatures = () => {
    setSelectedFeatures(features.map(f => f.feature_id));
  };

  const handleSelectAllLaws = () => {
    setSelectedLaws(laws.map(l => l.law_id));
  };

  const handleClearAllFeatures = () => {
    setSelectedFeatures([]);
  };

  const handleClearAllLaws = () => {
    setSelectedLaws([]);
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
            {/* Features Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Features to Check</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAllFeatures}
                    className="text-sm text-primary-600 hover:text-primary-800 underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAllFeatures}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {features.map((feature) => (
                  <label key={feature.feature_id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.feature_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeatures([...selectedFeatures, feature.feature_id]);
                        } else {
                          setSelectedFeatures(selectedFeatures.filter(id => id !== feature.feature_id));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{feature.feature_name}</p>
                      <p className="text-xs text-gray-500 truncate">{feature.feature_id}</p>
                    </div>
                    <span className={`badge ${
                      feature.risk_level.toLowerCase() === 'high' ? 'badge-danger' :
                      feature.risk_level.toLowerCase() === 'medium' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {feature.risk_level}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Laws Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Laws to Check Against</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAllLaws}
                    className="text-sm text-primary-600 hover:text-primary-800 underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAllLaws}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {laws.map((law) => (
                  <label key={law.law_id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedLaws.includes(law.law_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLaws([...selectedLaws, law.law_id]);
                        } else {
                          setSelectedLaws(selectedLaws.filter(id => id !== law.law_id));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{law.law_name}</p>
                      <p className="text-xs text-gray-500 truncate">{law.law_id}</p>
                    </div>
                  </label>
                ))}
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

          {/* Run Check Button */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={handleComplianceCheck}
              disabled={isLoading || selectedFeatures.length === 0 || selectedLaws.length === 0}
              className="btn btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Running Compliance Check...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Run Compliance Check
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
              Configure your compliance check above and click "Run Compliance Check" to get started.
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
