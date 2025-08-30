export interface Law {
  index: string;
  law_description: string;
  law_title: string;
  'country-region': string;
}

export interface Feature {
  feature_name: string;
  feature_description: string;
}

export interface ComplianceResult {
  feature_name: string;
  law_title: string;
  law_description: string;
  compliance_status: 'compliant' | 'non-compliant' | 'requires_review';
  reasoning: string;
  recommendations: string[];
}

export interface ComplianceCheckRequest {
  features?: string[];
  laws?: string[];
  include_abbreviations?: boolean;
  include_corrections?: boolean;
}

export interface ComplianceCheckResponse {
  results: ComplianceResult[];
  summary: {
    total_features: number;
    total_laws: number;
    compliant_count: number;
    non_compliant_count: number;
    review_required_count: number;
    overall_risk_score: number;
  };
  timestamp: string;
}

export interface FeedbackRequest {
  feature_name: string;
  law_title: string;
  feedback_type: 'correction' | 'suggestion' | 'question';
  message: string;
  user_email?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback_id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export interface ComplianceSummary {
  total_features: number;
  total_laws: number;
  compliant_count: number;
  non_compliant_count: number;
  review_required_count: number;
}
