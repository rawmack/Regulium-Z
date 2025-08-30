import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { Law, Feature } from '../types';

export class DataHandler {
  private laws: Law[] = [];
  private features: Feature[] = [];

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await this.loadLaws();
      await this.loadFeatures();
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  private async loadLaws(): Promise<void> {
    return new Promise((resolve, reject) => {
      const lawsPath = path.resolve(process.env.LAWS_CSV_PATH || '../laws.csv');
      const results: Law[] = [];

      if (!fs.existsSync(lawsPath)) {
        console.warn(`Laws CSV file not found at: ${lawsPath}`);
        resolve();
        return;
      }

      fs.createReadStream(lawsPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.laws = results;
          console.log(`Loaded ${results.length} laws from CSV`);
          resolve();
        })
        .on('error', reject);
    });
  }

  private async loadFeatures(): Promise<void> {
    return new Promise((resolve, reject) => {
      const featuresPath = path.resolve(process.env.FEATURES_CSV_PATH || '../features.csv');
      const results: Feature[] = [];

      if (!fs.existsSync(featuresPath)) {
        console.warn(`Features CSV file not found at: ${featuresPath}`);
        resolve();
        return;
      }

      fs.createReadStream(featuresPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.features = results;
          console.log(`Loaded ${results.length} features from CSV`);
          resolve();
        })
        .on('error', reject);
    });
  }

  public getLaws(): Law[] {
    return [...this.laws];
  }

  public getFeatures(): Feature[] {
    return [...this.features];
  }

  public getLawById(lawId: string): Law | undefined {
    return this.laws.find(law => law.law_id === lawId);
  }

  public getFeatureById(featureId: string): Feature | undefined {
    return this.features.find(feature => feature.feature_id === featureId);
  }

  public getLawsByCategory(category: string): Law[] {
    return this.laws.filter(law => 
      law.law_name.toLowerCase().includes(category.toLowerCase()) ||
      law.law_description.toLowerCase().includes(category.toLowerCase())
    );
  }

  public getFeaturesByRiskLevel(riskLevel: string): Feature[] {
    return this.features.filter(feature => 
      feature.risk_level.toLowerCase() === riskLevel.toLowerCase()
    );
  }

  public getFeaturesByPriority(priority: string): Feature[] {
    return this.features.filter(feature => 
      feature.priority.toLowerCase() === priority.toLowerCase()
    );
  }

  public refreshData(): Promise<void> {
    return this.loadData();
  }
}
