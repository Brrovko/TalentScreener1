# SkillChecker

SkillChecker is a comprehensive skills assessment platform designed to streamline the process of assessing candidates' skills for technical and non-technical positions. This platform enables organizations to create, manage, and analyze skill assessments seamlessly.

## Business Context

### Problem Statement
Organizations face challenges in efficiently and objectively assessing candidates' technical and soft skills during the hiring process. Traditional methods like manual evaluation are time-consuming, inconsistent, and often lack measurable outcomes.

### Target Audience
- HR professionals and recruiters
- Technical hiring managers
- Training and development teams
- Educational institutions

### Value Proposition
SkillChecker solves these challenges by providing:
- Standardized evaluation processes
- Objective scoring systems
- Time-efficient assessments
- Data-driven insights for hiring decisions
- Customizable test content tailored to specific roles

## Product Overview

SkillChecker is a complete skills assessment platform that supports the full assessment lifecycle:

### Key Features
- **Skills assessment**: Create, edit, and organize tests by categories
- **Question Bank**: Build a library of questions with various formats (multiple-choice, checkbox, text, code)
- **Candidate Management**: Organize candidate information and track their progress
- **Test Sessions**: Generate shareable test links with customizable expiration dates
- **Automated Scoring**: Instant scoring and results with pass/fail thresholds
- **Performance Analytics**: Visualize candidate performance and identify skill gaps
- **AI-Powered Question Generation**: Automatically generate questions based on test topics
- **CSV Import/Export**: Easily manage test questions through spreadsheet imports

### Primary Use Cases
1. **Technical Hiring**: Assess programming skills, technical knowledge, and problem-solving abilities
2. **Knowledge Verification**: Evaluate domain knowledge and understanding of specific topics
3. **Certification Programs**: Administer standardized assessments for certification purposes
4. **Educational Assessment**: Measure student comprehension and learning outcomes

## Technical Details

### Architecture

SkillChecker follows a modern full-stack architecture:

- **Frontend**: React with Tailwind CSS for styling and responsive design
- **Backend**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with Passport.js
- **API Integration**: OpenRouter AI integration for question generation

### Key Technologies

#### Frontend
- React 18
- TypeScript
- Tailwind CSS with component library (shadcn/ui)
- React Query for data fetching
- React Hook Form for form handling
- Recharts for data visualization
- i18next for internationalization

#### Backend
- Express.js with TypeScript
- PostgreSQL database
- Drizzle ORM for database operations
- Zod for schema validation
- Passport.js for authentication
- OpenRouter API for AI question generation

#### Infrastructure
- Docker and Docker Compose for containerization
- Multi-stage Docker builds for optimized images

### Project Structure
- `/client` - Frontend React application
- `/server` - Backend Express.js API
- `/shared` - Shared TypeScript types and schemas
- `/drizzle` - Database migrations and schema
- `/test` - Test plans and documentation

## Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (only needed if running without Docker)
- PostgreSQL 17 (only needed if running without Docker)

### Development Environment (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/skillchecker.tech.git
   cd skillchecker.tech
   ```

2. Create a `.env` file in the root directory with development configuration:
   ```
   # OpenRouter API (for AI question generation)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   LLM_MODEL=openai/gpt-3.5-turbo

   # SMTP config for EmailService
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_smtp_user
   SMTP_PASSWORD=your_smtp_password
   SMTP_FROM=SkillChecker <noreply@skillchecker.tech>

   # Application Settings
   NODE_ENV=development
   ```

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. Access the application at http://localhost:5005

### Alternative Setup (Without Docker)

For development without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with local PostgreSQL configuration:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillchecker
   SESSION_SECRET=your-secure-session-secret-key
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   LLM_MODEL=openai/gpt-3.5-turbo
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_smtp_user
   SMTP_PASSWORD=your_smtp_password
   SMTP_FROM=SkillChecker <noreply@skillchecker.tech>
   NODE_ENV=development
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. (Optional) To manually apply migrations without starting the server:
   ```bash
   npm run db:push
   ```

5. Access the application at http://localhost:5005

### Production Deployment

For production deployment, the application uses a multi-stage Docker build:

1. Update the `.env` file with production settings:
   ```
   DATABASE_URL=postgresql://production-user:secure-password@your-db-host:5432/skillchecker
   SESSION_SECRET=your-long-secure-session-secret
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   LLM_MODEL=openai/gpt-3.5-turbo
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_smtp_user
   SMTP_PASSWORD=your_smtp_password
   SMTP_FROM=SkillChecker <noreply@skillchecker.tech>
   NODE_ENV=production
   ```

2. Build and deploy using Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

## Default Credentials

After setting up the application, you can log in with the default administrator account:

- Username: `admin`
- Password: `admin123`

**Important**: Change these credentials immediately after the first login for security purposes.

## License

MIT

---

## Working with Allure Reports

To run server tests and generate Allure reports:

1. Execute tests:
   ```bash
   npm run test:server
   ```

2. Generate the report:
   ```bash
   npx allure generate <allure-results> -o <allure-report>
   ```

3. Open the report with the command:
   ```bash
   npx allure open <allure-report>
   ```
   This command will automatically start a local server and open the report in your browser.

**Important:**
- If you need to share the report, send the entire `allure-report` folder and include instructions to use `allure open` for viewing.
- Opening via file:// is not supported and will not work correctly.
