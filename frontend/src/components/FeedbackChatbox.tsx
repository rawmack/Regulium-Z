import React, { useState } from 'react';
import { ComplianceResult, FeedbackRequest } from '../types/api';
import { X, Send, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

interface FeedbackChatboxProps {
  isOpen: boolean;
  onClose: () => void;
  result: ComplianceResult | null;
  onSubmitFeedback: (feedback: FeedbackRequest) => Promise<void>;
}

const FeedbackChatbox: React.FC<FeedbackChatboxProps> = ({
  isOpen,
  onClose,
  result,
  onSubmitFeedback
}) => {
  const [feedbackType, setFeedbackType] = useState<'correction' | 'suggestion' | 'question'>('correction');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!result || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const feedback: FeedbackRequest = {
        feature_id: result.feature_id,
        law_id: result.law_id,
        feedback_type: feedbackType,
        message: message.trim(),
        user_email: userEmail.trim() || undefined
      };

      await onSubmitFeedback(feedback);
      
      setSubmitStatus('success');
      setMessage('');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);
      
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setMessage('');
      setUserEmail('');
      setSubmitStatus('idle');
    }
  };

  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Provide Feedback</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Context Information */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">Compliance Check Context</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Feature:</span> {result.feature_name}</p>
              <p><span className="font-medium">Law:</span> {result.law_name}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-1 ${
                  result.compliance_status === 'compliant' ? 'text-success-600' :
                  result.compliance_status === 'non-compliant' ? 'text-danger-600' :
                  'text-warning-600'
                }`}>
                  {result.compliance_status.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>

          {/* Feedback Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['correction', 'suggestion', 'question'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedbackType(type)}
                  className={`p-2 text-sm font-medium rounded-lg border transition-colors ${
                    feedbackType === type
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Describe your ${feedbackType}...`}
              className="input min-h-[100px] resize-none"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Email Input (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="email"
              id="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="input"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll use this to follow up on your feedback if needed.
            </p>
          </div>

          {/* Submit Status */}
          {submitStatus === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-success-50 border border-success-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <span className="text-success-800 font-medium">Feedback submitted successfully!</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center space-x-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-danger-600" />
              <span className="text-danger-800 font-medium">Failed to submit feedback. Please try again.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="btn btn-primary flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackChatbox;
