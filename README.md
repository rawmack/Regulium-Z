# Regulium-Z

AI-powered regulatory compliance checking application that uses GPT technology to automatically analyze features against regulatory requirements.

## 🚀 Features

- **Automated Compliance Checking**: AI-powered analysis of application features against regulatory laws
- **Smart Context Awareness**: Utilizes abbreviations and previous corrections for improved accuracy
- **Interactive Feedback System**: Users can provide corrections and suggestions to improve future analyses
- **Real-time Results**: Instant compliance status with detailed reasoning and recommendations
- **Modern Web Interface**: Beautiful, responsive UI built with React and Tailwind CSS
- **Comprehensive API**: RESTful backend with full CRUD operations for feedback management

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Express.js Server**: Fast, unopinionated web framework
- **OpenAI Integration**: GPT-powered compliance analysis
- **CSV Data Processing**: Reads laws and features from CSV files
- **Feedback Management**: Stores and retrieves user corrections
- **TypeScript**: Full type safety and modern JavaScript features

### Frontend (React + TypeScript)
- **React 18**: Latest React features with hooks
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **TypeScript**: Type-safe component development
- **Responsive Design**: Mobile-first approach with modern UI patterns

## 📁 Project Structure

```
Regulium-Z/
├── backend/                 # Node.js backend server
│   ├── src/
│   │   ├── data/           # Static data files
│   │   │   ├── abbreviations.json    # Custom abbreviations
│   │   │   └── corrections.json      # User feedback storage
│   │   ├── services/       # Business logic
│   │   │   ├── complianceChecker.ts  # GPT integration
│   │   │   ├── dataHandler.ts        # CSV processing
│   │   │   └── feedbackHandler.ts    # Feedback management
│   │   ├── routes/         # API endpoints
│   │   │   └── api.ts      # REST API routes
│   │   └── server.ts       # Main server entry point
│   ├── .env                # Environment configuration
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ComplianceTable.tsx   # Results display
│   │   │   └── FeedbackChatbox.tsx   # User feedback interface
│   │   ├── pages/          # Application views
│   │   │   └── index.tsx   # Main application page
│   │   ├── types/          # TypeScript interfaces
│   │   │   └── api.ts      # Shared API types
│   │   └── styles/         # CSS and styling
│   │       └── global.css  # Global styles and Tailwind
│   ├── package.json        # Frontend dependencies
│   ├── tsconfig.json       # TypeScript configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── vite.config.ts      # Vite build configuration
├── laws.csv                # Regulatory requirements database
├── features.csv            # Application features to check
├── package.json            # Root workspace configuration
└── README.md               # This file
```

## 🛠️ Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **OpenAI API Key**: Required for GPT-powered compliance checking

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
npm run dev:backend    # Backend on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:3000
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Documentation**: http://localhost:3001

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Paths
LAWS_CSV_PATH=../laws.csv
FEATURES_CSV_PATH=../features.csv
ABBREVIATIONS_JSON_PATH=./src/data/abbreviations.json
CORRECTIONS_JSON_PATH=./src/data/corrections.json
```

### Data Files

#### laws.csv
Contains regulatory requirements with columns:
- `law_id`: Unique identifier
- `law_name`: Name of the law/regulation
- `law_description`: Detailed description
- `compliance_requirements`: Specific requirements
- `penalties`: Non-compliance consequences
- `effective_date`: When the law takes effect

#### features.csv
Contains application features with columns:
- `feature_id`: Unique identifier
- `feature_name`: Feature name
- `feature_description`: Detailed description
- `implementation_details`: How it's implemented
- `risk_level`: High/Medium/Low risk assessment
- `priority`: Critical/High/Medium/Low priority

## 📊 API Endpoints

### Compliance
- `POST /api/compliance/check` - Run compliance analysis
- `GET /api/laws` - Get all laws
- `GET /api/laws/:id` - Get specific law
- `GET /api/features` - Get all features
- `GET /api/features/:id` - Get specific feature

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
- Select laws to check against from the right panel
- Choose options (abbreviations, corrections)
- Click "Run Compliance Check"

### 2. Review Results
- View compliance status for each feature-law combination
- Expand rows to see detailed reasoning and recommendations
- Check confidence scores and risk assessments

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
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality
```bash
# Lint frontend code
npm run lint --workspace=frontend

# Type check
npm run build --workspace=backend
npm run build --workspace=frontend
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

- [ ] Multi-language support
- [ ] Advanced compliance scoring algorithms
- [ ] Integration with external compliance databases
- [ ] Automated compliance monitoring
- [ ] Advanced reporting and analytics
- [ ] Mobile application
- [ ] API rate limiting and authentication
- [ ] Database integration for large-scale deployments

## 🙏 Acknowledgments

- OpenAI for GPT technology
- React and TypeScript communities
- Tailwind CSS for the beautiful UI framework
- Express.js for the robust backend framework
