import fs from 'fs';
import path from 'path';
import { Law, Feature } from '../types';
import { getCSVPath } from '../utils/pathUtils';

export class DataHandler {
  private laws: Law[] = [];
  private features: Feature[] = [];
  private isInitialized = false;
  private initializationPromise: Promise<void>;

  constructor() {
    // Start initialization and store the promise
    this.initializationPromise = this.initialize();
    
    // Wait for initialization to complete
    this.initializationPromise.then(() => {
      console.log('DataHandler initialization completed successfully');
    }).catch(error => {
      console.error('DataHandler initialization failed:', error);
    });
  }

  // Method to wait for initialization to complete
  public async waitForReady(): Promise<void> {
    await this.initializationPromise;
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
      throw error; // Re-throw to make the promise reject
    }
  }

  private async loadLaws(): Promise<void> {
    try {
      // Use shared path utility function
      const lawsPath = getCSVPath('laws.csv');
      
      console.log('Loading laws from:', lawsPath);
      console.log('Current working directory:', process.cwd());
      console.log('__dirname:', __dirname);
      
      if (!fs.existsSync(lawsPath)) {
        throw new Error(`Laws CSV file not found at: ${lawsPath}`);
      }

      const fileContent = fs.readFileSync(lawsPath, 'utf8');
      console.log('Laws CSV file size:', fileContent.length);
      
      const lines = fileContent.split('\n').filter(line => line.trim());
      console.log('Total lines in laws CSV:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('Laws CSV has insufficient data');
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
      
      if (results.length === 0) {
        throw new Error('No laws were loaded from the CSV file');
      }
      
    } catch (error) {
      console.error('Error loading laws:', error);
      throw error; // Re-throw to see the error in the main initialization
    }
  }

  private async loadFeatures(): Promise<void> {
    try {
      // Use shared path utility function
      const featuresPath = getCSVPath('features.csv');
      
      console.log('Loading features from:', featuresPath);
      
      if (!fs.existsSync(featuresPath)) {
        throw new Error(`Features CSV file not found at: ${featuresPath}`);
      }

      const fileContent = fs.readFileSync(featuresPath, 'utf8');
      console.log('Features CSV file size:', fileContent.length);
      
      const lines = fileContent.split('\n').filter(line => line.trim());
      console.log('Total lines in features CSV:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('Features CSV has insufficient data');
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
      
      if (results.length === 0) {
        throw new Error('No features were loaded from the CSV file');
      }
      
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
    const normalizedName = featureName.trim();
    return this.features.find(feature => 
      feature.feature_name.trim().toLowerCase() === normalizedName.toLowerCase()
    );
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

  public async addFeature(featureName: string, featureDescription: string): Promise<boolean> {
    try {
      console.log(`Adding new feature: ${featureName} with description: ${featureDescription}`);
      
      // Validate input
      if (!featureName || !featureDescription) {
        console.error('Invalid feature data: name and description are required');
        return false;
      }

      // Check if feature already exists (case-insensitive)
      const existingFeature = this.getFeatureByName(featureName);
      if (existingFeature) {
        console.warn(`Feature with name "${featureName}" already exists`);
        console.warn(`Existing feature: "${existingFeature.feature_name}"`);
        return false;
      }

      // Create new feature object
      const newFeature: Feature = {
        feature_name: featureName.trim(),
        feature_description: featureDescription.trim()
      };

      // Add to memory
      this.features.push(newFeature);
      console.log(`Feature added to memory: ${featureName}`);

      // Add to CSV file
      const featuresPath = getCSVPath('features.csv');
      console.log(`Writing feature to CSV: ${featuresPath}`);
      
      // Read existing CSV content
      let csvContent = '';
      if (fs.existsSync(featuresPath)) {
        csvContent = fs.readFileSync(featuresPath, 'utf8');
        // Remove trailing newline if exists
        csvContent = csvContent.replace(/\n$/, '');
      } else {
        // Create new CSV with headers
        csvContent = 'feature_name,feature_description\n';
      }

      // Add new feature row
      const newRow = `"${newFeature.feature_name}","${newFeature.feature_description}"`;
      csvContent += `\n${newRow}`;

      // Write back to CSV
      fs.writeFileSync(featuresPath, csvContent, 'utf8');
      console.log(`Feature successfully written to CSV: ${featureName}`);

      return true;
    } catch (error) {
      console.error('Error adding feature to CSV:', error);
      // Remove from memory if CSV write failed
      this.features = this.features.filter(f => f.feature_name !== featureName);
      return false;
    }
  }
}
