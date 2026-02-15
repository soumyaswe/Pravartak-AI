# Pravartak - AI Career Coach

![Pravartak Logo](public/logo.png)

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://prisma.io/)
[![Cognito](https://img.shields.io/badge/Cognito-Auth-orange?logo=Cognito)](https://Cognito.google.com/)

Your AI-powered career development platform for professional success

## Overview

Pravartak is a comprehensive AI-powered career coaching platform designed to accelerate professional growth through personalized guidance, interview preparation, and intelligent career tools. Built with modern web technologies, it provides a seamless experience for career development across various industries.

## Key Features

### **Core Career Tools**

- **Resume Builder** - ATS-optimized resume creation with intelligent suggestions
- **AI Cover Letter Generator** - Personalized cover letters tailored to job descriptions
- **CV Analyzer** - Detailed feedback and optimization recommendations
- **Mock Interview System** - AI-powered interview practice with real-time feedback

### **Career Analytics**

- **Progress Analytics** - Comprehensive tracking of career development metrics
- **Industry Insights** - Market trends, salary data, and job demand analysis
- **Career Roadmap Generator** - Personalized learning paths and milestones
- **Skill Assessment** - Track and improve professional competencies

### **AI-Powered Features**

- **Career Assistant Chat** - 24/7 AI support for career-related questions
- **Personalized Recommendations** - AI-driven suggestions based on user profile
- **Smart Goal Setting** - Intelligent career objective planning
- **Real-time Feedback** - Instant insights on documents and interview performance

## Technology Stack

### **Frontend**

- **Next.js 15.5.3** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless component primitives
- **Lucide React** - Beautiful icon library
- **Recharts** - Responsive chart library for analytics

### **Backend & Database**

- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Robust relational database
- **Server Actions** - Next.js server-side logic
- **API Routes** - RESTful endpoints for data management

### **Authentication & Security**

- **Cognito Authentication** - Secure user authentication
- **Google OAuth** - Social login integration
- **JWT Tokens** - Secure session management
- **Email/Password** - Traditional authentication option

### **AI & External Services**

- **Amazon Bedrock (Claude)** - Advanced language model integration
- **AWS SDK** - Bedrock Runtime client for AI services
- **Date-fns** - Modern date utility library
- **HTML2PDF** - Document generation and export
- **React Hook Form** - Form state management
- **Zod** - Schema validation

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database
- **Cognito** project with Authentication enabled
- **Amazon Bedrock API** access with Claude models enabled

## Installation & Setup

### 1. **Clone the Repository**

```bash
git clone https://github.com/Susmita-Codes/Pravartak.git
cd Pravartak
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Environment Configuration**

Create a `.env` file in the root directory:

```ini
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pravartak"

# Cognito Configuration
NEXT_PUBLIC_Cognito_API_KEY="your_Cognito_api_key"
NEXT_PUBLIC_Cognito_AUTH_DOMAIN="your_project.Cognitoapp.com"
NEXT_PUBLIC_Cognito_PROJECT_ID="your_project_id"
NEXT_PUBLIC_Cognito_STORAGE_BUCKET="your_project.Cognitostorage.app"
NEXT_PUBLIC_Cognito_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_Cognito_APP_ID="your_app_id"

# Amazon Bedrock AI Configuration
BEDROCK_API_KEY="your_bedrock_api_key"
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
MODEL_ID="your model id"
NEXT_PUBLIC_AWS_REGION="us-east-1"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. **Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 5. **Cognito Setup**

1. Create a Cognito project at [console.aws.amazon.com](https://console.aws.amazon.com)
2. Enable Authentication and Email/Password providers
3. Add your domain to authorized domains
4. Copy configuration to your .env file

### 6. **Start Development Server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

`
Pravartak/
 app/                          # Next.js App Router
    (auth)/                   # Authentication pages
       sign-in/
       sign-up/
    (main)/                   # Main application pages
       dashboard/            # Dashboard and analytics
       resume/               # Resume builder
       ai-cover-letter/      # Cover letter generator
       cv-analyser/          # CV analysis tool
       interview/            # Interview preparation
       mock-interview/       # AI mock interviews
       industry-insights/    # Market insights
       roadmap/              # Career roadmap
       analytics/            # Progress analytics
    api/                      # API routes
    globals.css               # Global styles
    layout.js                 # Root layout
 components/                   # Reusable UI components
    ui/                       # Base UI components
    header.jsx                # Navigation header
    hero.jsx                  # Landing page hero
    theme-provider.jsx        # Theme management
 contexts/                     # React contexts
    auth-context.js           # Cognito authentication
 lib/                          # Utilities and configurations
    prisma.js                 # Database client
    utils.js                  # Utility functions
    helper.js                 # Helper functions
    schema.js                 # Validation schemas
 actions/                      # Server actions
 data/                         # Static data files
 hooks/                        # Custom React hooks
 prisma/                       # Database schema and migrations
 public/                       # Static assets
`

## Key Features Implementation

### **Dashboard Architecture**

- **Modular Components** - Reusable dashboard widgets
- **Real-time Data** - Live career progress tracking
- **Responsive Design** - Mobile-first approach
- **Dark Theme** - Professional dark mode interface

### **Authentication Flow**

- **Cognito Integration** - Secure, scalable authentication
- **Protected Routes** - Role-based access control
- **Session Management** - Persistent login state
- **Onboarding Process** - Guided user setup

### **AI Integration**

- **Amazon Bedrock (Claude)** - Advanced natural language processing
- **Context-Aware Responses** - Career-focused AI assistance
- **Real-time Chat** - Instant AI support
- **Document Analysis** - Intelligent resume and CV feedback

### **Database Design**

- **User Management** - Comprehensive user profiles
- **Document Storage** - Resumes, cover letters, and portfolios
- **Progress Tracking** - Career milestone recording
- **Analytics Data** - Performance metrics and insights

## Deployment

### **Vercel (Recommended)**

#### Install Vercel CLI

```bash
npm i -g vercel
```

#### Deploy

```bash
vercel --prod
```

### **Docker**

#### Build image

```bash
docker build -t pravartak .
```

#### Run container

```bash
docker run -p 3000:3000 pravartak
```

### **Environment Variables for Production**

Ensure all environment variables are properly configured in your deployment platform.

## Testing

### Run tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Generate coverage report

```bash
npm run test:coverage
```

## API Documentation

### **Authentication Endpoints**

- POST /api/auth/signin - User authentication
- POST /api/auth/signup - User registration
- POST /api/auth/signout - User logout

### **Career Tools**

- GET /api/resume - Retrieve user resume
- POST /api/resume - Save resume data
- POST /api/cv-analyser - Analyze CV content
- POST /api/chat - AI assistant interaction

### **Analytics**

- GET /api/dashboard - Dashboard data
- GET /api/analytics - Progress analytics
- GET /api/industry-insights - Market data

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (git checkout -b feature/amazing-feature)
3. **Commit your changes** (git commit -m 'Add amazing feature')
4. **Push to the branch** (git push origin feature/amazing-feature)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Team

Quad Squad Development Team

- UI/UX Design & Development
- Backend Architecture
- AI Integration
- Quality Assurance

## Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment solutions
- **Cognito** - For authentication infrastructure
- **Tailwind CSS** - For the utility-first CSS framework
- **Prisma** - For the excellent ORM and database tools

## Support

For support, email [support@pravartak.ai](mailto:support@pravartak.ai) or join our community discussions.

---

Made with ❤️ by **Quad Squad**

Star this repository if you find it helpful!
