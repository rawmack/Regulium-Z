# Regulium-Z

AI-powered regulatory compliance checking application that uses advanced GPT technology to automatically analyze application features against regulatory requirements with intelligent relevance filtering.

## 🚀 Features

### Core Compliance Features
- **AI-Powered Compliance Analysis**: Advanced GPT-4/Gemini integration for intelligent regulatory analysis
- **Smart Relevance Filtering**: Automatically identifies only relevant laws for each feature, reducing false positives
- **Real-time Compliance Checking**: Instant analysis with detailed reasoning and actionable recommendations
- **Multi-Law Support**: Comprehensive database of regulatory requirements from various jurisdictions
- **Risk Assessment**: Automated risk scoring and compliance status classification

### Intelligent Analysis
- **Context-Aware Processing**: Utilizes abbreviations and previous corrections for improved accuracy
- **Conservative Filtering**: "Better to miss a law than include irrelevant ones" approach
- **Detailed Reasoning**: Comprehensive explanations for compliance decisions
- **Actionable Recommendations**: Specific, implementable suggestions for compliance improvement

### User Experience
- **Interactive Feedback System**: Users can provide corrections and suggestions to improve future analyses
- **Modern Web Interface**: Beautiful, responsive UI built with React and Tailwind CSS
- **Real-time Results**: Instant compliance status with detailed reasoning and recommendations
- **Comprehensive API**: RESTful backend with full CRUD operations for feedback management

### Data Management
- **CSV-Based Configuration**: Easy-to-edit CSV files for laws and features
- **Dynamic Feature Addition**: Add new features through the web interface
- **Feedback Persistence**: Corrections and suggestions are stored and applied to future analyses
- **Data Validation**: Robust error handling and data integrity checks

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Express.js Server**: Fast, unopinionated web framework with TypeScript
- **OpenRouter Integration**: Advanced AI model integration with Google Gemini 2.0 Flash
- **Intelligent Relevance Screening**: AI-powered law filtering for each feature
- **CSV Data Processing**: Reads laws and features from CSV files with robust parsing
- **Feedback Management**: Stores and retrieves user corrections with intelligent application
- **TypeScript**: Full type safety and modern JavaScript features
- **Error Handling**: Comprehensive error handling with graceful fallbacks

### Frontend (React + TypeScript)
- **React 18**: Latest React features with hooks and modern patterns
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **TypeScript**: Type-safe component development
- **Responsive Design**: Mobile-first approach with modern UI patterns
- **Real-time Updates**: Live feedback and status updates

## 📁 Project Structure

```
Regulium-Z/
├── backend/                 # Node.js backend server
│   ├── src/
│   │   ├── data/           # Static data files
│   │   │   ├── abbreviations.json    # Custom abbreviations for improved analysis
│   │   │   └── corrections.json      # User feedback storage and application
│   │   ├── services/       # Business logic
│   │   │   ├── complianceChecker.ts  # AI integration with relevance filtering
│   │   │   ├── dataHandler.ts        # CSV processing with validation
│   │   │   └── feedbackHandler.ts   # Feedback management and application
│   │   ├── routes/         # API endpoints
│   │   │   └── api.ts      # REST API routes with comprehensive endpoints
│   │   ├── types/          # TypeScript type definitions
│   │   │   └── index.ts    # Shared types across the application
│   │   ├── utils/          # Utility functions
│   │   │   └── pathUtils.ts # Path resolution utilities
│   │   └── server.ts       # Main server entry point
│   ├── __tests__/          # Backend test suite
│   │   ├── api.test.ts     # API endpoint tests
│   │   └── services.test.ts # Service layer tests
│   ├── .env                # Environment configuration
│   ├── package.json        # Backend dependencies
│   ├── jest.config.js      # Jest testing configuration
│   └── tsconfig.json       # TypeScript configuration
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ComplianceTable.tsx   # Results display with expandable details
│   │   │   └── FeedbackChatbox.tsx   # User feedback interface
│   │   ├── pages/          # Application views
│   │   │   └── index.tsx   # Main application page
│   │   ├── types/          # TypeScript interfaces
│   │   │   └── api.ts      # Shared API types
│   │   └── styles/         # CSS and styling
│   │       └── global.css  # Global styles and Tailwind
│   ├── __tests__/          # Frontend test suite
│   │   ├── App.test.tsx    # Main app tests
│   │   └── setup.ts        # Test setup configuration
│   ├── package.json        # Frontend dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── vite.config.ts      # Vite build configuration
│   └── vitest.config.ts    # Vitest testing configuration
├── backend/laws.csv        # Regulatory requirements database
├── backend/features.csv    # Application features to check
├── package.json            # Root workspace configuration
├── test-plan.md           # Comprehensive testing strategy
├── testing-summary.md     # Test results and coverage
└── README.md              # This file
```

## 🛠️ Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **OpenAI API Key**: Required for GPT-powered compliance checking (via OpenRouter)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Regulium-Z
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend and frontend dependencies
npm run install:all
```

### 3. Configure Environment
```bash
# Copy and edit the backend environment file
cp backend/.env.example backend/.env

# Edit backend/.env with your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start Development Servers
```bash
# Start both backend and frontend in development mode
npm run dev

# Or start them separately:
npm run dev:backend    # Backend on http://localhost:8000
npm run dev:frontend   # Frontend on http://localhost:3000
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **API Documentation**: http://localhost:8000

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# OpenAI Configuration (via OpenRouter)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=google/gemini-2.0-flash-001
OPENAI_API_BASE=https://openrouter.ai/api/v1

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Paths
LAWS_CSV_PATH=./laws.csv
FEATURES_CSV_PATH=./features.csv
ABBREVIATIONS_JSON_PATH=./src/data/abbreviations.json
CORRECTIONS_JSON_PATH=./src/data/corrections.json
```

### Data Files

#### laws.csv
Contains regulatory requirements with columns:
- `index`: Unique identifier
- `law_description`: Detailed description of the law
- `law_title`: Name of the law/regulation
- `country-region`: Jurisdiction where the law applies

#### features.csv
Contains application features with columns:
- `feature_name`: Feature name
- `feature_description`: Detailed description of the feature

## 📊 API Endpoints

### Compliance
- `POST /api/compliance/check` - Run compliance analysis with relevance filtering
- `GET /api/laws` - Get all laws
- `GET /api/features` - Get all features
- `POST /api/features` - Add new feature

### Feedback
- `POST /api/feedback` - Submit feedback/correction
- `GET /api/feedback` - Get all feedback
- `GET /api/feedback/feature/:id` - Get feedback by feature
- `GET /api/feedback/law/:id` - Get feedback by law
- `PATCH /api/feedback/:id/status` - Update feedback status
- `DELETE /api/feedback/:id` - Delete feedback

### System
- `GET /api/health` - Health check
- `POST /api/data/refresh` - Refresh data from CSV files

## 🎯 Usage

### 1. Configure Compliance Check
- Select features to analyze from the left panel
- Select laws to check against from the right panel (or let the system auto-filter)
- Choose options (abbreviations, corrections)
- Click "Run Compliance Check"

### 2. Review Results
- View compliance status for each feature-law combination
- Expand rows to see detailed reasoning and recommendations
- Check confidence scores and risk assessments
- See which laws were identified as relevant for each feature

### 3. Provide Feedback
- Click the feedback button on any result
- Choose feedback type (correction, suggestion, question)
- Provide detailed message and optional email
- Submit to improve future analyses

### 4. Monitor Progress
- Track compliance metrics over time
- Review feedback and corrections
- Use insights to improve feature implementations

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test:run     # Run tests
```

### Code Quality
```bash
# Lint all code
npm run lint

# Type check
npm run build --workspaces
```

## 🚀 Production Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production database if needed
- Set up proper CORS origins
- Configure rate limiting for production traffic

## 🧪 Testing

### Test Coverage
- **Backend Tests**: API endpoints, services, and data handling
- **Frontend Tests**: Component rendering and user interactions
- **Integration Tests**: End-to-end compliance checking workflows

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🔮 Roadmap

### Completed ✅
- [x] AI-powered compliance checking
- [x] Relevance filtering for laws
- [x] Interactive feedback system
- [x] Modern web interface
- [x] Comprehensive API
- [x] CSV-based data management
- [x] Error handling and fallbacks
- [x] Testing infrastructure

### Planned 🚧
- [ ] Multi-language support
- [ ] Advanced compliance scoring algorithms
- [ ] Integration with external compliance databases
- [ ] Automated compliance monitoring
- [ ] Advanced reporting and analytics
- [ ] Mobile application
- [ ] API rate limiting and authentication
- [ ] Database integration for large-scale deployments
- [ ] Real-time compliance alerts
- [ ] Compliance trend analysis

## 🙏 Acknowledgments

- OpenAI for GPT technology
- Google for Gemini 2.0 Flash model
- OpenRouter for AI model access
- React and TypeScript communities
- Tailwind CSS for the beautiful UI framework
- Express.js for the robust backend framework
- Vite for the fast build tooling

## 📊 Recent Updates

### Version 2.0 - Intelligent Relevance Filtering
- **Smart Law Filtering**: AI-powered relevance screening for each feature
- **Conservative Approach**: Better to miss a law than include irrelevant ones
- **Improved Performance**: Reduced API calls and faster processing
- **Enhanced Logging**: Detailed insights into filtering decisions
- **Better Error Handling**: Graceful fallbacks and comprehensive error messages

### Version 1.5 - Enhanced User Experience
- **Improved Feature Management**: Dynamic feature addition through web interface
- **Better Data Validation**: Robust CSV parsing and error handling
- **Enhanced Feedback System**: Persistent corrections and suggestions
- **Modern UI**: Responsive design with Tailwind CSS
- **Comprehensive Testing**: Full test coverage for all components
