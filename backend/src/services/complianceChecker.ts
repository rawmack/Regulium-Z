import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { DataHandler } from './dataHandler';
import { FeedbackHandler } from './feedbackHandler';
import { 
  ComplianceCheckRequest, 
  ComplianceCheckResponse, 
  ComplianceResult,
  Law,
  Feature 
} from '../types';

export class ComplianceChecker {
  private openai: OpenAI;
  private dataHandler: DataHandler;
  private feedbackHandler: FeedbackHandler;
  private abbreviations: { [key: string]: string } = {};

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.dataHandler = new DataHandler();
    this.feedbackHandler = new FeedbackHandler();
    this.loadAbbreviations();
  }

  private loadAbbreviations(): void {
    try {
      const abbreviationsPath = path.resolve(process.env.ABBREVIATIONS_JSON_PATH || './src/data/abbreviations.json');
      if (fs.existsSync(abbreviationsPath)) {
        const data = fs.readFileSync(abbreviationsPath, 'utf8');
        this.abbreviations = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load abbreviations:', error);
    }
  }

  public async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResponse> {
    try {
      // Ensure data is ready before proceeding
      if (!this.dataHandler.isReady()) {
        await this.dataHandler.waitForReady();
      }
      
      const laws = this.dataHandler.getLaws();
      const features = this.dataHandler.getFeatures();

      if (laws.length === 0 || features.length === 0) {
        throw new Error('No laws or features found. Please check your data files.');
      }

      const results: ComplianceResult[] = [];
      let compliantCount = 0;
      let nonCompliantCount = 0;
      let reviewRequiredCount = 0;
      let totalRiskScore = 0;

      // Filter features and laws based on request
      const targetFeatures = request.features 
        ? features.filter(f => request.features!.includes(f.feature_name))
        : features;
      
      const targetLaws = request.laws
        ? laws.filter(l => request.laws!.includes(l.law_title))
        : laws;

      // Check each feature against each law
      for (const feature of targetFeatures) {
        for (const law of targetLaws) {
          const result = await this.checkFeatureCompliance(feature, law, request);
          results.push(result);

          // Update counters
          switch (result.compliance_status) {
            case 'compliant':
              compliantCount++;
              break;
            case 'non-compliant':
              nonCompliantCount++;
              break;
            case 'requires_review':
              reviewRequiredCount++;
              break;
          }

          totalRiskScore += this.calculateRiskScore(result);
        }
      }

      const overallRiskScore = results.length > 0 ? totalRiskScore / results.length : 0;

      return {
        results,
        summary: {
          total_features: targetFeatures.length,
          total_laws: targetLaws.length,
          compliant_count: compliantCount,
          non_compliant_count: nonCompliantCount,
          review_required_count: reviewRequiredCount,
          overall_risk_score: Math.round(overallRiskScore * 100) / 100
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in compliance check:', error);
      throw error;
    }
  }

  private async checkFeatureCompliance(
    feature: Feature, 
    law: Law, 
    request: ComplianceCheckRequest
  ): Promise<ComplianceResult> {
    try {
      // Get relevant corrections if requested
      let correctionsContext = '';
      if (request.include_corrections) {
        const corrections = this.feedbackHandler.getCorrectionsForCompliance(feature.feature_name, law.law_title);
        if (corrections.length > 0) {
          correctionsContext = `\n\nPrevious corrections for this feature-law combination:\n${corrections.map(c => `- ${c.message}`).join('\n')}`;
        }
      }

      // Build the prompt for GPT
      const prompt = this.buildCompliancePrompt(feature, law, correctionsContext);
      
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a regulatory compliance expert. Analyze the feature implementation against the law requirements and provide a detailed compliance assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content || '';
      const parsedResult = this.parseGPTResponse(response, feature, law);

      return parsedResult;
    } catch (error) {
      console.error(`Error checking compliance for feature ${feature.feature_name} against law ${law.law_title}:`, error);
      
      // Return a fallback result
      return {
        feature_name: feature.feature_name,
        law_title: law.law_title,
        compliance_status: 'requires_review',
        confidence_score: 0,
        reasoning: 'Error occurred during compliance check. Manual review required.',
        recommendations: ['Review the feature implementation manually', 'Check system logs for errors'],
        risk_level: 'medium'
      };
    }
  }

  private buildCompliancePrompt(feature: Feature, law: Law, correctionsContext: string): string {
    const abbreviationsContext = Object.entries(this.abbreviations)
      .map(([abbr, full]) => `${abbr}: ${full}`)
      .join(', ');

    return `
Please analyze the compliance of this feature against the specified law.

FEATURE:
- Name: ${feature.feature_name}
- Description: ${feature.feature_description}

LAW:
- Title: ${law.law_title}
- Description: ${law.law_description}
- Country/Region: ${law['country-region']}

ABBREVIATIONS CONTEXT: ${abbreviationsContext}
${correctionsContext}

Please provide your analysis in the following JSON format:
{
  "compliance_status": "compliant|non-compliant|requires_review",
  "confidence_score": 0.0-1.0,
  "reasoning": "Detailed explanation of your assessment",
  "recommendations": ["Array of specific recommendations"],
  "risk_level": "low|medium|high"
}

Focus on:
1. Whether the feature implementation meets the law's requirements
2. Any gaps or compliance issues
3. Specific recommendations for achieving compliance
4. Risk assessment based on the feature's implementation details
`;
  }

  private parseGPTResponse(response: string, feature: Feature, law: Law): ComplianceResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          feature_name: feature.feature_name,
          law_title: law.law_title,
          compliance_status: parsed.compliance_status || 'requires_review',
          confidence_score: parsed.confidence_score || 0.5,
          reasoning: parsed.reasoning || 'Analysis completed but response format was unclear',
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Review implementation manually'],
          risk_level: parsed.risk_level || 'medium'
        };
      }
    } catch (error) {
      console.warn('Failed to parse GPT response as JSON:', error);
    }

    // Fallback parsing
    return {
      feature_name: feature.feature_name,
      law_title: law.law_title,
      compliance_status: 'requires_review',
      confidence_score: 0.3,
      reasoning: 'Response parsing failed. Manual review required.',
      recommendations: ['Review the feature implementation manually', 'Check compliance requirements'],
      risk_level: 'medium'
    };
  }

  private calculateRiskScore(result: ComplianceResult): number {
    const baseRisk = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8
    }[result.risk_level] || 0.5;

    const complianceMultiplier = {
      'compliant': 0.3,
      'requires_review': 0.7,
      'non-compliant': 1.0
    }[result.compliance_status] || 0.7;

    return baseRisk * complianceMultiplier * (1 - result.confidence_score);
  }

  public async refreshData(): Promise<void> {
    await this.dataHandler.refreshData();
    this.loadAbbreviations();
  }
}
