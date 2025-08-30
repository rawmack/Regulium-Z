import React, { useState } from 'react';
import { ComplianceResult, ComplianceSummary } from '../types/api';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';

interface ComplianceTableProps {
  results: ComplianceResult[];
  summary: ComplianceSummary;
  onFeedbackClick: (result: ComplianceResult) => void;
}

const ComplianceTable: React.FC<ComplianceTableProps> = ({ results, summary, onFeedbackClick }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (resultId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'non-compliant':
        return <XCircle className="w-5 h-5 text-danger-600" />;
      case 'requires_review':
        return <AlertCircle className="w-5 h-5 text-warning-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <span className="badge-success">Compliant</span>;
      case 'non-compliant':
        return <span className="badge-danger">Non-Compliant</span>;
      case 'requires_review':
        return <span className="badge-warning">Review Required</span>;
      default:
        return <span className="badge-info">Unknown</span>;
    }
  };



  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Features</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_features}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <div className="w-6 h-6 bg-primary-600 rounded"></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Laws</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_laws}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <div className="w-6 h-6 bg-primary-600 rounded"></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliant</p>
              <p className="text-2xl font-bold text-success-600">{summary.compliant_count}</p>
            </div>
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Non-Compliant</p>
              <p className="text-2xl font-bold text-danger-600">{summary.non_compliant_count}</p>
            </div>
            <div className="p-2 bg-danger-100 rounded-lg">
              <XCircle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </div>


      </div>

      {/* Results Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Results</h3>
          <p className="text-sm text-gray-500">
            {results.length} feature-law combinations analyzed
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Feature</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Law</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const resultId = `${result.feature_name}-${result.law_title}-${index}`;
                const isExpanded = expandedRows.has(resultId);
                
                return (
                  <React.Fragment key={resultId}>
                    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isExpanded ? 'bg-blue-50' : ''
                    }`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.compliance_status)}
                          {getStatusBadge(result.compliance_status)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{result.feature_name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{result.law_title}</p>
                          <p className="text-sm text-gray-500">{result.law_description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleRow(resultId)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            onClick={() => onFeedbackClick(result)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Provide feedback"
                          >
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                                         {/* Expanded Details Row */}
                     {isExpanded && (
                       <tr className="bg-blue-50 border-b border-gray-100">
                         <td colSpan={4} className="py-4 px-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Reasoning</h4>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {result.reasoning}
                              </p>
                            </div>
                            
                            {result.recommendations.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  {result.recommendations.map((rec, recIndex) => (
                                    <li key={recIndex} className="text-gray-700 text-sm">
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Feature: {result.feature_name}</span>
                                <span>Law: {result.law_title}</span>
                              </div>
                              <button
                                onClick={() => onFeedbackClick(result)}
                                className="btn btn-primary text-sm"
                              >
                                Provide Feedback
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceTable;
