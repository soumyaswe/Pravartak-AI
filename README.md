# Pravartak - AI Career Coach

![Pravartak Logo](public/logo.png)

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://prisma.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?logo=firebase)](https://firebase.google.com/)

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

- **Firebase Authentication** - Secure user authentication
- **Google OAuth** - Social login integration
- **JWT Tokens** - Secure session management
- **Email/Password** - Traditional authentication option

### **AI & External Services**

- **Gemini AI API** - Advanced language model integration
- **Date-fns** - Modern date utility library
- **HTML2PDF** - Document generation and export
- **React Hook Form** - Form state management
- **Zod** - Schema validation

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database
- **Firebase** project with Authentication enabled
- **Gemini AI API** key

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

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# AI Integration
GEMINI_API_KEY="your_gemini_api_key"

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

### 5. **Firebase Setup**

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Google and Email/Password providers
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
    auth-context.js           # Firebase authentication
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

- **Firebase Integration** - Secure, scalable authentication
- **Protected Routes** - Role-based access control
- **Session Management** - Persistent login state
- **Onboarding Process** - Guided user setup

### **AI Integration**

- **Gemini AI** - Advanced natural language processing
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
- **Firebase** - For authentication infrastructure
- **Tailwind CSS** - For the utility-first CSS framework
- **Prisma** - For the excellent ORM and database tools

## Support

For support, email [support@pravartak.ai](mailto:support@pravartak.ai) or join our community discussions.

---

Made with ❤️ by **Quad Squad**

Star this repository if you find it helpful!

## **Setup After Redaction**

- **Rotate leaked or exposed keys (urgent):** Immediately delete any compromised keys in the Google Cloud Console, Firebase console, and any other provider dashboards. Create new credentials and service account keys before you redeploy.
- **Store secrets securely:** Do NOT commit service account JSON files, API keys, or database passwords into the repository. Use Google Secret Manager (or your cloud provider's secret store) and inject secrets at deploy time.
- **Quick provisioning (PowerShell, Windows):** From the project root (requires `gcloud` CLI installed and logged in):

```powershell
# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Optional: enable required APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com

# Run the interactive helper to create a service account, upload its key to Secret Manager, and prepare deployment
.\scripts\setup-gcp.ps1
```

- **Local development note:** For safe local testing only, place your service account JSON at `backend/service-account-key.json` and set `GOOGLE_APPLICATION_CREDENTIALS=./backend/service-account-key.json` in your local `.env`. NEVER commit that file — add it to `.gitignore`.
- **Leaked-keys check:** If you maintain a short list of known-leaked API key strings, provide them at deploy time instead of hardcoding. Example (Cloud Run env var):

```bash
LEAKED_KEYS_JSON='["key1","key2"]'
```

- **Final validation:** After provisioning new credentials, deploy to Cloud Run (or your chosen host), verify the app functions, and then permanently delete old keys from all provider consoles.

### Enabling a single `.env` for the project

This repository is configured to use a single root `.env` file for local development. Put all environment variables in the repository root `.env` file. Do NOT commit real secrets; the root `.env` is ignored by Git.

Notes:

- Client-side variables must begin with `NEXT_PUBLIC_` so Next.js exposes them to the browser (these are not secret).

- Server-only variables (database URLs, private API keys, service-account references) must NOT be used in client code — keep them server-side. The Python backend reads the project root `.env` automatically.

- For production, prefer Secret Manager or Workload Identity; do not deploy service-account JSON files into the container image.

### Enabling a local pre-commit secret check

To avoid accidentally committing secrets, enable the supplied Git hook scanner:

1. Set Git to use the repository hooks folder:

```bash
git config core.hooksPath .githooks
```

1. Make the hook executable (Git Bash / WSL):

```bash
chmod +x .githooks/pre-commit
```

1. (Optional) Run a manual scan anytime:

```powershell
.\scripts\scan-secrets.ps1
```

The pre-commit hook runs a short PowerShell-based scan and will abort a commit if it finds likely secret patterns. This is an extra safety net — you should still rotate any keys you believe are compromised.
# Deployment 2025-11-25 20:03:04
