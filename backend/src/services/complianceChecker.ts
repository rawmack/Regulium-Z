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
  private dataHandler: DataHandler;
  private feedbackHandler: FeedbackHandler;
  private abbreviations: { [key: string]: string } = {};

  constructor() {
    this.dataHandler = new DataHandler();
    this.feedbackHandler = new FeedbackHandler();
    this.loadAbbreviations();
    
    // Log configuration for debugging
    console.log('ComplianceChecker initialized with:');
    console.log('- API Base URL:', process.env.OPENAI_API_BASE);
    console.log('- Model:', process.env.OPENAI_MODEL);
    console.log('- API Key exists:', !!process.env.OPENAI_API_KEY);
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
        }
      }

      return {
        results,
        summary: {
          total_features: targetFeatures.length,
          total_laws: targetLaws.length,
          compliant_count: compliantCount,
          non_compliant_count: nonCompliantCount,
          review_required_count: reviewRequiredCount,
          overall_risk_score: this.calculateRiskScore(compliantCount, nonCompliantCount, reviewRequiredCount, targetLaws.length)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in compliance check:', error);
      throw error;
    }
  }

  public async checkFeatureCompliance(
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
      
      // Call OpenRouter API directly
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "HTTP-Referer": "http://localhost:8000", // Site URL for rankings
          "X-Title": "Regulium-Z Compliance Checker", // Site title for rankings
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [
            {
              "role": "system",
              "content": "You are a regulatory compliance expert specializing in digital services, social media, and online platform regulations. Analyze the feature implementation against the law requirements and provide a comprehensive compliance assessment. Always respond in valid JSON format."
            },
            {
              "role": "user",
              "content": prompt
            }
          ],
          "temperature": 0.3,
          "max_tokens": 1000, // Increased significantly with available credits
          "stream": false // Disable streaming to get complete response
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const completion = await response.json() as any;
      console.log(`Raw OpenRouter response for ${feature.feature_name} vs ${law.law_title}:`, JSON.stringify(completion, null, 2));
      
      const responseContent = completion.choices?.[0]?.message?.content || '';
      console.log(`LLM response received for ${feature.feature_name} vs ${law.law_title}:`, responseContent);
      console.log(`Response length: ${responseContent.length} characters`);
      console.log(`Response type: ${typeof responseContent}`);
      
      const parsedResult = this.parseGPTResponse(responseContent, feature, law);

      return parsedResult;
    } catch (error) {
      console.error(`Error checking compliance for feature ${feature.feature_name} against law ${law.law_title}:`, error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      
      // Log additional error information if it's an API error
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        console.error('API Error Response:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data
        });
      }
      
      // Return a fallback result
      return {
        feature_name: feature.feature_name,
        law_title: law.law_title,
        law_description: law.law_description,
        compliance_status: 'requires_review',
        reasoning: 'Error occurred during compliance check. Manual review required.',
        recommendations: ['Review the feature implementation manually', 'Check system logs for errors']
      };
    }
  }

  private buildCompliancePrompt(feature: Feature, law: Law, correctionsContext: string): string {
    return `Feature: ${feature.feature_name}
Description: ${feature.feature_description}

Law: ${law.law_title}
Description: ${law.law_description}

${correctionsContext}

Analyze the compliance of this feature against the law. Consider:
1. Does the feature implementation align with the law's requirements?
2. Are there any potential violations or compliance gaps?
3. What specific aspects need attention?

Respond in this exact JSON format:
{
  "compliance_status": "compliant|non_compliant|requires_review",
  "reasoning": "Detailed explanation of compliance assessment",
  "recommendations": ["Specific action item 1", "Specific action item 2", "Specific action item 3"]
}

Ensure the response is valid JSON with no additional text before or after.`;
  }

  private parseGPTResponse(response: string, feature: Feature, law: Law): ComplianceResult {
    try {
      // Log the raw response for debugging
      console.log(`Raw response for ${feature.feature_name} vs ${law.law_title}:`, response.substring(0, 200) + '...');
      
      // Clean the response - remove any markdown formatting
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to extract JSON from the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Validate required fields
          if (parsed.compliance_status && parsed.reasoning && parsed.recommendations) {
            // Validate compliance_status values
            const validStatuses = ['compliant', 'non_compliant', 'requires_review'];
            if (!validStatuses.includes(parsed.compliance_status)) {
              console.warn(`Invalid compliance_status: ${parsed.compliance_status}, defaulting to requires_review`);
              parsed.compliance_status = 'requires_review';
            }
            
            return {
              feature_name: feature.feature_name,
              law_title: law.law_title,
              law_description: law.law_description,
              compliance_status: parsed.compliance_status,
              reasoning: parsed.reasoning,
              recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Review implementation manually']
            };
          } else {
            console.warn('JSON response missing required fields:', parsed);
          }
        } catch (jsonError) {
          console.warn('Failed to parse extracted JSON:', jsonError);
        }
      } else {
        console.warn('No JSON found in response');
      }
    } catch (error) {
      console.warn('Failed to parse GPT response:', error);
    }

    // Fallback parsing
    return {
      feature_name: feature.feature_name,
      law_title: law.law_title,
      law_description: law.law_description,
      compliance_status: 'requires_review',
      reasoning: 'Response parsing failed. Manual review required.',
      recommendations: ['Review the feature implementation manually', 'Check compliance requirements']
    };
  }

  private calculateRiskScore(compliantCount: number, nonCompliantCount: number, reviewRequiredCount: number, totalLaws: number): number {
    const totalChecks = compliantCount + nonCompliantCount + reviewRequiredCount;
    if (totalChecks === 0) {
      return 0; // No checks performed
    }
    const riskScore = (nonCompliantCount + reviewRequiredCount) / totalChecks;
    return Math.round(riskScore * 100); // Scale to 0-100
  }

  public async refreshData(): Promise<void> {
    await this.dataHandler.refreshData();
    this.loadAbbreviations();
  }
}
