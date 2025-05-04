# SkillChecker E2E API Testing Plan

## Overview

This document outlines the plan for implementing End-to-End (E2E) API tests for the SkillChecker application. These tests verify API endpoints by making real HTTP requests to a running instance of the application, deployed as real services using Docker Compose (docker-compose.yml). All API tests interact with the application strictly via HTTP, ensuring the test environment closely matches production conditions. No in-memory or direct Express injection is used for E2E tests.

## Technology Stack

- **Testing Framework**: Jest
- **HTTP Client**: Supertest
- **Assertion Library**: Jest built-in assertions
- **Reporting**: 
  - jest-html-reporter for basic test reports
  - supertest-logger for detailed HTTP request/response logging
  - jest-html-reporters for advanced HTML reports with visualizations
- **Language**: TypeScript
- **Environment Management**: dotenv for test environment variables

### Justification

Jest and Supertest provide a powerful combination for API testing:
- Jest offers a comprehensive test runner with excellent reporting capabilities
- Supertest simplifies making HTTP requests and asserting responses
- TypeScript ensures type safety and better IDE support
- Enhanced reporting system with detailed HTTP logging provides transparency and simplifies debugging

## Directory Structure

```
test/
  api/
    fixtures/           # Test data for each resource type
      tests.ts
      questions.ts
      candidates.ts
      sessions.ts
      users.ts
      categories.ts     # Categories fixture data
    helpers/            # Helper functions for common operations
      auth.ts           # Authentication helpers
      request.ts        # Request helpers
      testUtils.ts      # Utilities for test data setup and teardown via API
      logger.ts         # HTTP request/response logger
    tests/              # Test files organized by resource
      tests.test.ts
      questions.test.ts
      candidates.test.ts
      sessions.test.ts
      users.test.ts
      auth.test.ts
      categories.test.ts
      ai-generation.test.ts    # Tests for AI question generation
    setup.ts            # Global setup for API tests
    teardown.ts         # Global teardown for API tests
  jest-e2e.config.js    # Jest configuration for E2E tests
  test-environments.js  # Environment configurations for different test scenarios
  reports/              # Generated test reports
    html/               # HTML reports
    logs/               # HTTP logs
```

## Test Configuration

The `jest-e2e.config.js` file will configure Jest for API testing:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/api/**/*.test.ts'],
  setupFilesAfterEnv: ['./test/api/setup.ts'],
  globalTeardown: './test/api/teardown.ts',
  testTimeout: 30000, // 30 seconds
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'SkillChecker API Test Report',
      outputPath: './test/reports/html/basic-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
    }],
    ['jest-html-reporters', {
      publicPath: './test/reports/html',
      filename: 'detailed-report.html',
      openReport: true,
      inlineSource: true,
      expand: true
    }]
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'server/src/routes/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageDirectory: './test/reports/coverage',
  coverageReporters: ['text', 'html'],
  verbose: true,
};
```

## Test Approach

### Test Organization

Tests will be organized by resource type, with separate test files for each API resource:
- Tests API (`/api/tests/*`)
- Questions API (`/api/questions/*`)
- Candidates API (`/api/candidates/*`)
- Sessions API (`/api/sessions/*`)
- Users API (`/api/users/*`)
- Categories API (`/api/categories/*`)
- Authentication
- AI Question Generation API

All tests are executed via HTTP to the real application instance running in Docker Compose. This ensures that the tests validate the actual deployed service behavior, including network, configuration, and integration aspects.

Within each test file, tests will be grouped by HTTP method (GET, POST, PATCH, DELETE) and functionality.

### Test Scope

The API tests will cover:

1. **Basic CRUD operations** for all resources
2. **Validation and error handling**:
   - Invalid input data
   - Missing required fields
   - Unauthorized access
   - Not found resources
3. **Business logic**:
   - Test scoring
   - Test session management
   - Permission-based access control

### Test Data Management

Since tests will run against a live service, we need a strategy for managing test data:

1. **API-only approach**: All test data will be created, retrieved, and cleaned up using the standard API endpoints
2. **Isolation**: All test data will be prefixed with "TEST_" to easily identify test-specific data
3. **Setup/Teardown**: Each test will create necessary data in setup and clean it up in teardown
4. **Independent Tests**: Tests will be designed to be independent and not rely on data created by other tests

### Authentication and Authorization

For protected endpoints, tests will need to authenticate:

1. Create test users with different roles via the API:
   - Admin user with full permissions
   - Regular user with limited permissions
   - Candidate user with only test-taking permissions
2. Implement login functionality in a helper
3. Include authentication tokens in requests to protected endpoints
4. Test permissions by verifying that users can only access authorized resources

## API Endpoints to Test

Based on the SkillChecker architecture, the following API endpoints will be tested:

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/auth/register` (if applicable)

### Tests
- GET `/api/tests` (list all tests)
- GET `/api/tests/:id` (get a specific test)
- POST `/api/tests` (create a new test)
- PATCH `/api/tests/:id` (update a test)
- DELETE `/api/tests/:id` (delete a test)
- POST `/api/tests/:id/duplicate` (duplicate a test)

### Questions
- GET `/api/questions` (list all questions, with filters)
- GET `/api/questions/:id` (get a specific question)
- POST `/api/questions` (create a new question)
- PATCH `/api/questions/:id` (update a question)
- DELETE `/api/questions/:id` (delete a question)
- POST `/api/questions/generate` (AI-generated questions)

### Candidates
- GET `/api/candidates` (list all candidates)
- GET `/api/candidates/:id` (get a specific candidate)
- POST `/api/candidates` (create a new candidate)
- PATCH `/api/candidates/:id` (update a candidate)
- DELETE `/api/candidates/:id` (delete a candidate)

### Test Sessions
- GET `/api/sessions` (list all sessions)
- GET `/api/sessions/:id` (get a specific session)
- POST `/api/sessions` (create a new session)
- GET `/api/sessions/:id/results` (get session results)
- POST `/api/sessions/:id/submit` (submit answers)
- GET `/api/sessions/:id/questions` (get session questions)

### Categories
- GET `/api/categories` (list all categories)
- GET `/api/categories/:id` (get a specific category)
- POST `/api/categories` (create a new category)
- PATCH `/api/categories/:id` (update a category)
- DELETE `/api/categories/:id` (delete a category)

### Users
- GET `/api/users` (list all users)
- GET `/api/users/:id` (get a specific user)
- POST `/api/users` (create a new user)
- PATCH `/api/users/:id` (update a user)
- DELETE `/api/users/:id` (delete a user)

## Example Test

Here's an example of a simple E2E API test for the GET /api/tests endpoint with detailed logging:

```typescript
import request from 'supertest';
import { expect } from '@jest/globals';
import { logRequest } from '../helpers/logger';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5005';

describe('Tests API', () => {
  describe('GET /api/tests', () => {
    it('should return all tests', async () => {
      // Create a supertest instance with logging
      const req = request(API_URL).get('/api/tests');
      
      // Execute the request with logging
      const response = await logRequest(req, 'get-all-tests');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const test = response.body[0];
        expect(test).toHaveProperty('id');
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('description');
      }
    });
  });
});
```

## HTTP Request/Response Logging

To provide detailed logging of HTTP requests and responses, we'll implement a custom logger:

```typescript
// helpers/logger.ts
import fs from 'fs';
import path from 'path';
import { SuperTest, Test } from 'supertest';

/**
 * Logs HTTP request and response in a readable format
 * @param request Supertest request
 * @param testName Test name for log identification
 */
export async function logRequest(
  request: SuperTest<Test>, 
  testName: string
): Promise<any> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const logDir = path.join(__dirname, '../../reports/logs');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFilePath = path.join(logDir, `${testName}-${timestamp}.log`);
  const htmlLogPath = path.join(logDir, `${testName}-${timestamp}.html`);
  
  try {
    // Execute the request
    const response = await request;
    
    // Get request data from supertest internal API
    const req = request.request;
    const method = req.method;
    const url = req.url;
    const requestHeaders = req.getHeaders();
    const requestBody = req._data || {};
    
    // Format data for logging
    const logData = {
      test: testName,
      timestamp: new Date().toISOString(),
      request: {
        method,
        url,
        headers: requestHeaders,
        body: requestBody
      },
      response: {
        status: response.status,
        headers: response.headers,
        body: response.body
      }
    };
    
    // Write JSON log
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    
    // Generate HTML log for easy viewing
    const htmlContent = generateHtmlLog(logData);
    fs.writeFileSync(htmlLogPath, htmlContent);
    
    return response;
  } catch (error) {
    // Log error
    fs.writeFileSync(
      logFilePath, 
      JSON.stringify({
        test: testName,
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack
      }, null, 2)
    );
    throw error;
  }
}

/**
 * Generates HTML page with request/response data
 */
function generateHtmlLog(logData) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Test Log: ${logData.test}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; color: #333; }
    h1, h2, h3 { margin-top: 0; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,.1); padding: 20px; margin-bottom: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
    .status-2xx { background: #d4edda; color: #155724; }
    .status-4xx { background: #f8d7da; color: #721c24; }
    .status-5xx { background: #f8d7da; color: #721c24; }
    .http-verb { display: inline-block; padding: 3px 6px; border-radius: 3px; margin-right: 5px; }
    .get { background: #007bff; color: white; }
    .post { background: #28a745; color: white; }
    .put, .patch { background: #ffc107; color: black; }
    .delete { background: #dc3545; color: white; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .toggle-btn { cursor: pointer; background: #f8f9fa; border: none; padding: 5px 10px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>API Test: ${logData.test}</h1>
        <div>
          <span class="status status-${logData.response.status.toString()[0]}xx">
            Status: ${logData.response.status}
          </span>
        </div>
      </div>
      <p>Timestamp: ${logData.timestamp}</p>
    </div>
    
    <div class="card">
      <h2>Request</h2>
      <p>
        <span class="http-verb ${logData.request.method.toLowerCase()}">${logData.request.method}</span>
        ${logData.request.url}
      </p>
      
      <h3>Headers</h3>
      <table>
        <thead>
          <tr>
            <th>Header</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(logData.request.headers).map(([key, value]) => `
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h3>Body</h3>
      <pre>${JSON.stringify(logData.request.body, null, 2)}</pre>
    </div>
    
    <div class="card">
      <h2>Response</h2>
      
      <h3>Status: ${logData.response.status}</h3>
      
      <h3>Headers</h3>
      <table>
        <thead>
          <tr>
            <th>Header</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(logData.response.headers).map(([key, value]) => `
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h3>Body</h3>
      <pre>${JSON.stringify(logData.response.body, null, 2)}</pre>
    </div>
  </div>
  <script>
    // JavaScript for interactivity if needed
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const target = document.getElementById(targetId);
        target.style.display = target.style.display === 'none' ? 'block' : 'none';
      });
    });
  </script>
</body>
</html>
  `;
}
```

Example usage of the logger in a test:

```typescript
import request from 'supertest';
import { expect } from '@jest/globals';
import { login } from '../helpers/auth';
import { logRequest } from '../helpers/logger';

const API_URL = process.env.TEST_API_URL || 'http://localhost:5005';

describe('Questions API', () => {
  describe('POST /api/questions', () => {
    let authToken: string;
    
    beforeAll(async () => {
      // Login as admin
      authToken = await login('admin', 'admin123');
    });
    
    it('should create a new question', async () => {
      const questionData = {
        text: 'TEST_What is Node.js?',
        type: 'multiple_choice',
        options: [
          { text: 'A browser', isCorrect: false },
          { text: 'A JavaScript runtime', isCorrect: true },
          { text: 'A database', isCorrect: false }
        ],
        testId: 1,
        points: 10
      };
      
      // Create the request
      const req = request(API_URL)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(questionData);
      
      // Log the request and get the response
      const response = await logRequest(req, 'create-question');
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.text).toBe(questionData.text);
    });
  });
});
```

## Enhanced HTML Reporting

To create detailed HTML reports, we'll use a combination of tools:

1. **jest-html-reporter** - basic test reporting
2. **jest-html-reporters** - enhanced reporting with additional visualization and detail
3. **Custom HTTP logs** - detailed logs for each request/response in HTML format

To integrate these tools, we need to install additional packages:

```bash
npm install --save-dev jest-html-reporter jest-html-reporters
```

Reports will be generated after each test run:

1. **Basic HTML report** - `test/reports/html/basic-report.html`
2. **Enhanced HTML report** - `test/reports/html/detailed-report.html`
3. **Individual HTTP logs** - `test/reports/logs/{testName}-{timestamp}.html`

### Report Structure

1. **Basic report** contains:
   - Table of all test results (success/failure)
   - Test execution time
   - Error messages for failed tests

2. **Enhanced report** contains:
   - Charts and diagrams of test results
   - Execution time for each test
   - Nested test descriptions and results
   - Test filtering capabilities

3. **HTTP logs** contain:
   - HTTP request details (method, URL, headers, body)
   - HTTP response details (status, headers, body)
   - Formatted and highlighted JSON
   - Request execution time information

## CI Integration

To save reports in CI environment, we need to configure CI artifacts:

```yaml
# .github/workflows/e2e-tests.yml
# ...

jobs:
  test:
    # ...
    steps:
      # ...
      - name: Run E2E Tests
        run: npm run test:e2e
      
      - name: Archive test reports
        uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: |
            test/reports/html
            test/reports/logs
            test/reports/coverage
```

## Implementation Steps

### 1. Setup Dependencies

Add the necessary packages to the project:

```bash
npm install --save-dev jest ts-jest supertest @types/jest @types/supertest jest-html-reporter jest-html-reporters msw
```

### 2. Create Configuration Files

Create the Jest configuration file for E2E tests:

```bash
# Create jest-e2e.config.js in the project root
```

### 3. Create Test Structure

Set up the directory structure for the tests and reports:

```bash
mkdir -p test/api/fixtures test/api/helpers test/api/tests test/reports/html test/reports/logs
```

### 4. Implement Helper Functions

Create helper functions for:
- Authentication
- Request handling
- Test data creation and cleanup via the API
- HTTP request/response logging

### 5. Implement Test Fixtures

Create fixtures for each resource type:
- Tests
- Questions
- Candidates
- Sessions
- Users
- Categories

### 6. Implement Tests with Logging

Implement tests for each API endpoint with detailed logging:
1. Authentication
2. Tests API
3. Questions API
4. Candidates API
5. Sessions API
6. Users API
7. Categories API
8. AI Question Generation

### 7. Set Up Reporting

Configure the HTML reporters to generate detailed test reports:
- Basic HTML report
- Enhanced HTML report with visualizations
- Individual HTTP request/response logs

### 8. Create CI Integration

Add a CI workflow to run the E2E tests on pull requests or deployments, including saving test reports as artifacts.

## Running the Tests

### Local Development Environment

To run the E2E API tests locally:

1. Start the application with Docker Compose (which spins up all real services):
   ```bash
   docker-compose up -d
   ```

   The tests will interact with the running services via HTTP, exactly as a real client would.

2. Run the tests:
   ```bash
   npm run test:e2e
   ```

### CI Environment

For CI pipelines, create a separate docker-compose configuration (docker-compose.test.yml) if needed, but the principle remains the same: tests are executed against the real running services via HTTP.

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  # Application services configured for testing
  # ...
```

Run tests in CI:
```bash
docker-compose -f docker-compose.test.yml up -d
npm run test:e2e
docker-compose -f docker-compose.test.yml down
```

## Test Report

The HTML test report will be generated in the `test/reports` directory after running the tests. It will include:
- Overall test summary
- Pass/fail status for each test
- Test duration
- Error messages for failed tests
- Stack traces for debugging
- Code coverage metrics
- Detailed HTTP request/response logs

## Continuous Monitoring

After implementing the initial test suite, establish a process for:

1. **Test Maintenance**: Regular reviews and updates as the API evolves
2. **Coverage Monitoring**: Track coverage metrics to identify untested areas
3. **Performance Baseline**: Track API response times to detect degradation

## Future Improvements

1. **API Client**: Generate a TypeScript client from the API schema
2. **Performance Testing**: Add performance tests for critical endpoints
3. **Contract Testing**: Implement contract tests to ensure API compatibility
4. **Snapshot Testing**: Implement API response snapshot testing for stable endpoints
5. **Load Testing**: Implement load tests for high-traffic endpoints
6. **Security Testing**: Add tests for common security vulnerabilities (e.g., OWASP Top 10)

## Checklist

- [ ] Install dependencies including reporting tools
- [ ] Create Jest E2E configuration with report settings
- [ ] Set up directory structure including reports directories
- [ ] Implement authentication helpers
- [ ] Implement request helpers with HTTP logging
- [ ] Implement HTTP request/response logger
- [ ] Create test fixtures
- [ ] Implement tests for authentication with logging
- [ ] Implement tests for Tests API with logging
- [ ] Implement tests for Questions API with logging
- [ ] Implement tests for Candidates API with logging
- [ ] Implement tests for Sessions API with logging
- [ ] Implement tests for Users API with logging
- [ ] Implement tests for Categories API with logging
- [ ] Implement tests for AI Question Generation with logging
- [ ] Configure HTML reporters
- [ ] Add custom HTML log formatter
- [ ] Add code coverage reporting
- [ ] Add npm script for running E2E tests
- [ ] Create docker-compose.test.yml
- [ ] Configure CI to save test reports as artifacts
- [ ] Update documentation
- [ ] Set up CI integration
