import * as fs from 'fs';
import * as path from 'path';
import { FeedbackRequest, FeedbackResponse, Correction } from '../types';

export class FeedbackHandler {
  private correctionsPath: string;

  constructor() {
    this.correctionsPath = path.resolve(process.env.CORRECTIONS_JSON_PATH || './src/data/corrections.json');
    this.ensureCorrectionsFile();
  }

  private ensureCorrectionsFile(): void {
    const dir = path.dirname(this.correctionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(this.correctionsPath)) {
      const initialData = {
        corrections: [],
        feedback: [],
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.correctionsPath, JSON.stringify(initialData, null, 2));
    }
  }

  private readCorrectionsFile(): any {
    try {
      const data = fs.readFileSync(this.correctionsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading corrections file:', error);
      return {
        corrections: [],
        feedback: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private writeCorrectionsFile(data: any): void {
    try {
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.correctionsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing corrections file:', error);
      throw new Error('Failed to save feedback');
    }
  }

  public async submitFeedback(feedback: FeedbackRequest): Promise<FeedbackResponse> {
    try {
      const data = this.readCorrectionsFile();
      const feedbackId = this.generateId();

      const newFeedback: Correction = {
        id: feedbackId,
        feature_id: feedback.feature_id,
        law_id: feedback.law_id,
        feedback_type: feedback.feedback_type,
        message: feedback.message,
        user_email: feedback.user_email,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      data.feedback.push(newFeedback);

      // If it's a correction, also add it to corrections
      if (feedback.feedback_type === 'correction') {
        data.corrections.push(newFeedback);
      }

      this.writeCorrectionsFile(data);

      return {
        success: true,
        message: 'Feedback submitted successfully',
        feedback_id: feedbackId
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return {
        success: false,
        message: 'Failed to submit feedback',
        feedback_id: ''
      };
    }
  }

  public getCorrections(): Correction[] {
    try {
      const data = this.readCorrectionsFile();
      return data.corrections || [];
    } catch (error) {
      console.error('Error reading corrections:', error);
      return [];
    }
  }

  public getFeedback(): Correction[] {
    try {
      const data = this.readCorrectionsFile();
      return data.feedback || [];
    } catch (error) {
      console.error('Error reading feedback:', error);
      return [];
    }
  }

  public getCorrectionsByFeature(featureId: string): Correction[] {
    return this.getCorrections().filter(correction => 
      correction.feature_id === featureId
    );
  }

  public getCorrectionsByLaw(lawId: string): Correction[] {
    return this.getCorrections().filter(correction => 
      correction.law_id === lawId
    );
  }

  public updateCorrectionStatus(correctionId: string, status: 'pending' | 'reviewed' | 'implemented'): boolean {
    try {
      const data = this.readCorrectionsFile();
      
      // Update in corrections array
      const correctionIndex = data.corrections.findIndex((c: Correction) => c.id === correctionId);
      if (correctionIndex !== -1) {
        data.corrections[correctionIndex].status = status;
      }

      // Update in feedback array
      const feedbackIndex = data.feedback.findIndex((f: Correction) => f.id === correctionId);
      if (feedbackIndex !== -1) {
        data.feedback[feedbackIndex].status = status;
      }

      this.writeCorrectionsFile(data);
      return true;
    } catch (error) {
      console.error('Error updating correction status:', error);
      return false;
    }
  }

  public deleteCorrection(correctionId: string): boolean {
    try {
      const data = this.readCorrectionsFile();
      
      data.corrections = data.corrections.filter((c: Correction) => c.id !== correctionId);
      data.feedback = data.feedback.filter((f: Correction) => f.id !== correctionId);

      this.writeCorrectionsFile(data);
      return true;
    } catch (error) {
      console.error('Error deleting correction:', error);
      return false;
    }
  }

  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getCorrectionsForCompliance(featureId: string, lawId: string): Correction[] {
    return this.getCorrections().filter(correction => 
      correction.feature_id === featureId && 
      correction.law_id === lawId &&
      correction.status === 'implemented'
    );
  }
}
