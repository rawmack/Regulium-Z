import fs from 'fs';
import path from 'path';
import { Law, Feature } from '../types';

export class DataHandler {
  private laws: Law[] = [];
  private features: Feature[] = [];
  private isInitialized = false;

  constructor() {
    // Initialize immediately and wait for completion
    this.initialize().then(() => {
      console.log('DataHandler initialization completed successfully');
    }).catch(error => {
      console.error('DataHandler initialization failed:', error);
    });
  }

  private async initialize(): Promise<void> {
    try {
      console.log('Starting DataHandler initialization...');
      console.log('Current working directory:', process.cwd());
      
      await this.loadLaws();
      await this.loadFeatures();
      
      console.log(`Initialization complete. Loaded ${this.laws.length} laws and ${this.features.length} features`);
      this.isInitialized = true;
      console.log('DataHandler initialized successfully');
    } catch (error) {
      console.error('Error initializing DataHandler:', error);
      this.isInitialized = false;
    }
  }

  private async loadLaws(): Promise<void> {
    try {
      const lawsPath = path.resolve(process.env.LAWS_CSV_PATH || '../laws.csv');
      console.log('Loading laws from:', lawsPath);
      
      if (!fs.existsSync(lawsPath)) {
        console.warn(`Laws CSV file not found at: ${lawsPath}`);
        return;
      }

      const fileContent = fs.readFileSync(lawsPath, 'utf8');
      console.log('Laws CSV file size:', fileContent.length);
      
      const lines = fileContent.split('\n').filter(line => line.trim());
      console.log('Total lines in laws CSV:', lines.length);
      
      if (lines.length < 2) {
        console.warn('Laws CSV has insufficient data');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      console.log('Laws CSV headers:', headers);
      
      const results: Law[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV with commas in quoted fields
        const values = this.parseCSVLine(line);
        console.log(`Line ${i}: ${line} -> Parsed values:`, values);
        if (values.length >= 4) {
          const law: Law = {
            index: values[0]?.trim() || '',
            law_description: values[1]?.trim() || '',
            law_title: values[2]?.trim() || '',
            'country-region': values[3]?.trim() || ''
          };
          results.push(law);
          console.log('Parsed law:', law);
        } else {
          console.warn(`Line ${i} has insufficient values: ${values.length} expected 4`);
        }
      }
      
      this.laws = results;
      console.log(`Loaded ${results.length} laws successfully`);
      
    } catch (error) {
      console.error('Error loading laws:', error);
      throw error; // Re-throw to see the error in the main initialization
    }
  }

  private async loadFeatures(): Promise<void> {
    try {
      const featuresPath = path.resolve(process.env.FEATURES_CSV_PATH || '../features.csv');
      console.log('Loading features from:', featuresPath);
      
      if (!fs.existsSync(featuresPath)) {
        console.warn(`Features CSV file not found at: ${featuresPath}`);
        return;
      }

      const fileContent = fs.readFileSync(featuresPath, 'utf8');
      console.log('Features CSV file size:', fileContent.length);
      
      const lines = fileContent.split('\n').filter(line => line.trim());
      console.log('Total lines in features CSV:', lines.length);
      
      if (lines.length < 2) {
        console.warn('Features CSV has insufficient data');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      console.log('Features CSV headers:', headers);
      
      const results: Feature[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV with commas in quoted fields
        const values = this.parseCSVLine(line);
        if (values.length >= 2) {
          const feature: Feature = {
            feature_name: values[0]?.trim() || '',
            feature_description: values[1]?.trim() || ''
          };
          results.push(feature);
          console.log('Parsed feature:', feature);
        }
      }
      
      this.features = results;
      console.log(`Loaded ${results.length} features successfully`);
      
    } catch (error) {
      console.error('Error loading features:', error);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  public getLaws(): Law[] {
    return [...this.laws];
  }

  public getFeatures(): Feature[] {
    return [...this.features];
  }

  public getLawByTitle(lawTitle: string): Law | undefined {
    return this.laws.find(law => law.law_title === lawTitle);
  }

  public getFeatureByName(featureName: string): Feature | undefined {
    return this.features.find(feature => feature.feature_name === featureName);
  }

  public getLawsByCountry(country: string): Law[] {
    return this.laws.filter(law => 
      law['country-region'].toLowerCase().includes(country.toLowerCase())
    );
  }

  public getLawsByDescription(description: string): Law[] {
    return this.laws.filter(law => 
      law.law_description.toLowerCase().includes(description.toLowerCase()) ||
      law.law_title.toLowerCase().includes(description.toLowerCase())
    );
  }

  public refreshData(): Promise<void> {
    return this.initialize();
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}
