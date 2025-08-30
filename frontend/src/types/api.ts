export interface Law {
  law_id: string;
  law_name: string;
  law_description: string;
  compliance_requirements: string;
  penalties: string;
  effective_date: string;
}

export interface Feature {
  feature_id: string;
  feature_name: string;
  feature_description: string;
  implementation_details: string;
  risk_level: string;
  priority: string;
}

export interface ComplianceResult {
  feature_id: string;
  feature_name: string;
  law_id: string;
  law_name: string;
  compliance_status: 'compliant' | 'non-compliant' | 'requires_review';
  confidence_score: number;
  reasoning: string;
  recommendations: string[];
  risk_level: string;
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
  feature_id: string;
  law_id: string;
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
  overall_risk_score: number;
}
