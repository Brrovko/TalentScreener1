# SkillChecker E2E API Testing Plan

## Overview

This document outlines the plan for implementing End-to-End (E2E) API tests for the SkillChecker application. These tests will verify that the API endpoints function correctly by making real HTTP requests to a running instance of the application.

## Technology Stack

- **Testing Framework**: Jest
- **HTTP Client**: Supertest
- **Assertion Library**: Jest built-in assertions
- **Reporting**: jest-html-reporter
- **Language**: TypeScript

### Justification

Jest and Supertest provide a powerful combination for API testing:
- Jest offers a comprehensive test runner with excellent reporting capabilities
- Supertest simplifies making HTTP requests and asserting responses
- TypeScript ensures type safety and better IDE support
- jest-html-reporter generates detailed HTML reports for better visualization of test results

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
    helpers/            # Helper functions for common operations
      auth.ts           # Authentication helpers
      request.ts        # Request helpers
    tests/              # Test files organized by resource
      tests.test.ts
      questions.test.ts
      candidates.test.ts
      sessions.test.ts
      users.test.ts
      auth.test.ts
    setup.ts            # Global setup for API tests
  jest-e2e.config.js    # Jest configuration for E2E tests
```

## Test Configuration

The `jest-e2e.config.js` file will configure Jest for API testing:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/api/**/*.test.ts'],
  setupFilesAfterEnv: ['./test/api/setup.ts'],
  testTimeout: 30000, // 30 seconds
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'SkillChecker API Test Report',
      outputPath: './test-report/api-test-results.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
    }]
  ],
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
- Authentication

Within each test file, tests will be grouped by HTTP method (GET, POST, PATCH, DELETE) and functionality.

### Test Data Management

Since tests will run against a live service, we need a strategy for managing test data:

1. **Isolation**: All test data will be prefixed with "TEST_" to easily identify and clean up
2. **Setup/Teardown**: Each test will create necessary data in setup and clean it up in teardown
3. **Independent Tests**: Tests will be designed to be independent and not rely on data created by other tests

### Authentication

For protected endpoints, tests will need to authenticate:

1. Create a test user with appropriate permissions
2. Implement login functionality in a helper
3. Include authentication tokens in requests to protected endpoints

## Example Test

Here's an example of a simple E2E API test for the GET /api/tests endpoint:

```typescript
import request from 'supertest';
import { expect } from '@jest/globals';

const API_URL = 'http://localhost:5005';

describe('Tests API', () => {
  describe('GET /api/tests', () => {
    it('should return all tests', async () => {
      const response = await request(API_URL)
        .get('/api/tests')
        .expect(200);
      
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

For a more complex test that requires authentication and data setup:

```typescript
import request from 'supertest';
import { expect } from '@jest/globals';
import { login } from '../helpers/auth';
import { createTestTest, deleteTestTest } from '../fixtures/tests';

const API_URL = 'http://localhost:5005';

describe('Tests API', () => {
  describe('POST /api/tests', () => {
    let authToken: string;
    
    beforeAll(async () => {
      // Login as admin
      authToken = await login('admin', 'admin123');
    });
    
    it('should create a new test', async () => {
      const testData = {
        name: 'TEST_New Test',
        description: 'Test created by E2E test',
        category: 'programming',
        timeLimit: 30,
        passingScore: 70
      };
      
      const response = await request(API_URL)
        .post('/api/tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testData.name);
      
      // Clean up
      await deleteTestTest(response.body.id, authToken);
    });
  });
});
```

## Implementation Steps

### 1. Setup Dependencies

Add the necessary packages to the project:

```bash
npm install --save-dev jest ts-jest supertest @types/jest @types/supertest jest-html-reporter
```

### 2. Create Configuration Files

Create the Jest configuration file for E2E tests:

```bash
# Create jest-e2e.config.js in the project root
```

### 3. Create Test Structure

Set up the directory structure for the tests:

```bash
mkdir -p test/api/fixtures test/api/helpers test/api/tests
```

### 4. Implement Helper Functions

Create helper functions for:
- Authentication
- Request handling
- Test data creation and cleanup

### 5. Implement Test Fixtures

Create fixtures for each resource type:
- Tests
- Questions
- Candidates
- Sessions
- Users

### 6. Implement Tests

Implement tests for each API endpoint, starting with the most critical ones:
1. Authentication
2. Tests API
3. Questions API
4. Candidates API
5. Sessions API
6. Users API

### 7. Set Up Reporting

Configure the HTML reporter to generate detailed test reports.

### 8. Create CI Integration

Add a CI workflow to run the E2E tests on pull requests or deployments.

## Running the Tests

To run the E2E API tests:

1. Start the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Run the tests:
   ```bash
   npm run test:e2e
   ```

Add the following script to package.json:
```json
"scripts": {
  "test:e2e": "jest --config jest-e2e.config.js"
}
```

## Test Report

The HTML test report will be generated in the `test-report` directory after running the tests. It will include:
- Overall test summary
- Pass/fail status for each test
- Test duration
- Error messages for failed tests
- Stack traces for debugging

## Future Improvements

1. **Test Data Management**: Implement a more sophisticated approach to test data management
2. **Database Seeding**: Create a dedicated seed script for test data
3. **API Client**: Generate a TypeScript client from the API schema
4. **Performance Testing**: Add performance tests for critical endpoints
5. **Contract Testing**: Implement contract tests to ensure API compatibility

## Checklist

- [ ] Install dependencies
- [ ] Create Jest E2E configuration
- [ ] Set up directory structure
- [ ] Implement authentication helpers
- [ ] Implement request helpers
- [ ] Create test fixtures
- [ ] Implement tests for authentication
- [ ] Implement tests for Tests API
- [ ] Implement tests for Questions API
- [ ] Implement tests for Candidates API
- [ ] Implement tests for Sessions API
- [ ] Implement tests for Users API
- [ ] Configure HTML reporter
- [ ] Add npm script for running E2E tests
- [ ] Update documentation
- [ ] Set up CI integration
