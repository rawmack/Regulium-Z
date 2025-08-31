import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';

// Mock the API calls
vi.mock('../types/api', () => ({
  api: {
    getLaws: vi.fn(),
    getFeatures: vi.fn(),
    checkCompliance: vi.fn(),
    createFeedback: vi.fn(),
    getFeedback: vi.fn(),
  },
}));

// Mock the components
vi.mock('../components/ComplianceTable', () => ({
  default: ({ results, onFeedback }: any) => (
    <div data-testid="compliance-table">
      <h3>Compliance Results</h3>
      {results?.map((result: any, index: number) => (
        <div key={index} data-testid={`result-${index}`}>
          <span>Feature: {result.featureId}</span>
          <span>Law: {result.lawId}</span>
          <span>Compliance: {result.compliance ? 'Compliant' : 'Non-Compliant'}</span>
          <button onClick={() => onFeedback(result)}>Feedback</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../components/FeedbackChatbox', () => ({
  default: ({ isOpen, onClose, onSubmit }: any) => (
    isOpen ? (
      <div data-testid="feedback-chatbox">
        <h3>Feedback</h3>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ message: 'Test feedback' })}>Submit</button>
      </div>
    ) : null
  ),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main application', () => {
    render(<App />);
    
    expect(screen.getByText('Regulium-Z')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Regulatory Compliance Checking')).toBeInTheDocument();
  });

  it('loads laws and features on mount', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockResolvedValue({
      success: true,
      data: [
        { index: 1, law_title: 'Test Law 1', law_description: 'Test Description 1' },
        { index: 2, law_title: 'Test Law 2', law_description: 'Test Description 2' },
      ],
    });
    
    (api.getFeatures as any).mockResolvedValue({
      success: true,
      data: [
        { feature_name: 'Test Feature 1', feature_description: 'Test Description 1' },
        { feature_name: 'Test Feature 2', feature_description: 'Test Description 2' },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(api.getLaws).toHaveBeenCalled();
      expect(api.getFeatures).toHaveBeenCalled();
    });
  });

  it('handles loading states', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    (api.getFeatures as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockRejectedValue(new Error('API Error'));
    (api.getFeatures as any).mockRejectedValue(new Error('API Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading data/)).toBeInTheDocument();
    });
  });

  it('allows selecting features and laws', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockResolvedValue({
      success: true,
      data: [
        { index: 1, law_title: 'Test Law 1', law_description: 'Test Description 1' },
      ],
    });
    
    (api.getFeatures as any).mockResolvedValue({
      success: true,
      data: [
        { feature_name: 'Test Feature 1', feature_description: 'Test Description 1' },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Law 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
    });

    // Test feature selection
    const featureCheckbox = screen.getByLabelText('Test Feature 1');
    fireEvent.click(featureCheckbox);
    expect(featureCheckbox).toBeChecked();

    // Test law selection
    const lawCheckbox = screen.getByLabelText('Test Law 1');
    fireEvent.click(lawCheckbox);
    expect(lawCheckbox).toBeChecked();
  });

  it('performs compliance check when run button is clicked', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockResolvedValue({
      success: true,
      data: [
        { index: 1, law_title: 'Test Law 1', law_description: 'Test Description 1' },
      ],
    });
    
    (api.getFeatures as any).mockResolvedValue({
      success: true,
      data: [
        { feature_name: 'Test Feature 1', feature_description: 'Test Description 1' },
      ],
    });

    (api.checkCompliance as any).mockResolvedValue({
      success: true,
      data: [
        {
          featureId: 0,
          lawId: 1,
          compliance: true,
          reasoning: 'Test reasoning',
          confidence: 0.8,
          recommendations: ['Test recommendation'],
        },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Law 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
    });

    // Select feature and law
    const featureCheckbox = screen.getByLabelText('Test Feature 1');
    const lawCheckbox = screen.getByLabelText('Test Law 1');
    fireEvent.click(featureCheckbox);
    fireEvent.click(lawCheckbox);

    // Click run compliance check
    const runButton = screen.getByText('Run Compliance Check');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(api.checkCompliance).toHaveBeenCalledWith({
        features: [0],
        laws: [1],
        options: {
          useAbbreviations: false,
          useCorrections: false,
        },
      });
    });
  });

  it('displays compliance results after check', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockResolvedValue({
      success: true,
      data: [
        { index: 1, law_title: 'Test Law 1', law_description: 'Test Description 1' },
      ],
    });
    
    (api.getFeatures as any).mockResolvedValue({
      success: true,
      data: [
        { feature_name: 'Test Feature 1', feature_description: 'Test Description 1' },
      ],
    });

    (api.checkCompliance as any).mockResolvedValue({
      success: true,
      data: [
        {
          featureId: 0,
          lawId: 1,
          compliance: true,
          reasoning: 'Test reasoning',
          confidence: 0.8,
          recommendations: ['Test recommendation'],
        },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Law 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
    });

    // Select feature and law
    const featureCheckbox = screen.getByLabelText('Test Feature 1');
    const lawCheckbox = screen.getByLabelText('Test Law 1');
    fireEvent.click(featureCheckbox);
    fireEvent.click(lawCheckbox);

    // Click run compliance check
    const runButton = screen.getByText('Run Compliance Check');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByTestId('compliance-table')).toBeInTheDocument();
      expect(screen.getByTestId('result-0')).toBeInTheDocument();
    });
  });

  it('handles compliance check errors', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockResolvedValue({
      success: true,
      data: [
        { index: 1, law_title: 'Test Law 1', law_description: 'Test Description 1' },
      ],
    });
    
    (api.getFeatures as any).mockResolvedValue({
      success: true,
      data: [
        { feature_name: 'Test Feature 1', feature_description: 'Test Description 1' },
      ],
    });

    (api.checkCompliance as any).mockRejectedValue(new Error('Compliance check failed'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Law 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
    });

    // Select feature and law
    const featureCheckbox = screen.getByLabelText('Test Feature 1');
    const lawCheckbox = screen.getByLabelText('Test Law 1');
    fireEvent.click(featureCheckbox);
    fireEvent.click(lawCheckbox);

    // Click run compliance check
    const runButton = screen.getByText('Run Compliance Check');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/Error performing compliance check/)).toBeInTheDocument();
    });
  });

  it('opens feedback chatbox when feedback button is clicked', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockResolvedValue({
      success: true,
      data: [
        { index: 1, law_title: 'Test Law 1', law_description: 'Test Description 1' },
      ],
    });
    
    (api.getFeatures as any).mockResolvedValue({
      success: true,
      data: [
        { feature_name: 'Test Feature 1', feature_description: 'Test Description 1' },
      ],
    });

    (api.checkCompliance as any).mockResolvedValue({
      success: true,
      data: [
        {
          featureId: 0,
          lawId: 1,
          compliance: true,
          reasoning: 'Test reasoning',
          confidence: 0.8,
          recommendations: ['Test recommendation'],
        },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Law 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
    });

    // Select feature and law
    const featureCheckbox = screen.getByLabelText('Test Feature 1');
    const lawCheckbox = screen.getByLabelText('Test Law 1');
    fireEvent.click(featureCheckbox);
    fireEvent.click(lawCheckbox);

    // Click run compliance check
    const runButton = screen.getByText('Run Compliance Check');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByTestId('compliance-table')).toBeInTheDocument();
    });

    // Click feedback button
    const feedbackButton = screen.getByText('Feedback');
    fireEvent.click(feedbackButton);

    await waitFor(() => {
      expect(screen.getByTestId('feedback-chatbox')).toBeInTheDocument();
    });
  });

  it('toggles options correctly', async () => {
    const { api } = await import('../types/api');
    
    (api.getLaws as any).mockResolvedValue({
      success: true,
      data: [
        { index: 1, law_title: 'Test Law 1', law_description: 'Test Description 1' },
      ],
    });
    
    (api.getFeatures as any).mockResolvedValue({
      success: true,
      data: [
        { feature_name: 'Test Feature 1', feature_description: 'Test Description 1' },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Law 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
    });

    // Test abbreviations option
    const abbreviationsCheckbox = screen.getByLabelText('Use Abbreviations');
    fireEvent.click(abbreviationsCheckbox);
    expect(abbreviationsCheckbox).toBeChecked();

    // Test corrections option
    const correctionsCheckbox = screen.getByLabelText('Use Corrections');
    fireEvent.click(correctionsCheckbox);
    expect(correctionsCheckbox).toBeChecked();
  });
});
