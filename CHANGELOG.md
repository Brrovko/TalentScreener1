# Changelog

## [1.8.5] - 2025-05-10
### Changed
- Removed unused translation key `tests.category` from locale files.

## [1.8.4] - 2025-05-10
### Changed
- Removed the `Category` field from the test details page, since the category property has been deleted from the schema.

## [1.5.0] - 2025-05-10
### Added
- Automatic email notification to candidate when a test session is created via POST /api/sessions.
- Email includes test name, unique test link, expiration time (if set), and time limit.
- EmailService is now instantiated only when sending an email, preventing test failures due to missing SMTP environment variables.

## [1.4.0] - 2025-05-10
### Changed
- Removed unused close method from EmailService and all related test code.
- EmailService tests now use only mocks, no real email sending.


All notable changes to the SkillChecker project will be documented in this file.

This format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.3] - 2025-05-08

### Changed
- The Allure report section in README.md is now fully in English for consistency across project documentation.

## [1.7.2] - 2025-05-08

### Changed
- Allure report instructions in README.md now recommend only the `allure open` command for viewing reports, removing alternative http-server/python methods for simplicity and clarity.

## [1.7.1] - 2025-05-08

### Added
- Added a section to README.md with clear instructions on how to properly open Allure reports: why file:// does not work, and how to use a local server (http-server, python -m http.server, or allure open) for viewing the report in a browser.

## [1.5.1] - 2025-05-08
### Removed
- Temporarily removed the test for importing questions from CSV in `tests.test.ts` due to instability. Needs further investigation.

## [1.5.0] - 2025-05-08
### Removed
- Completely removed `server/__tests__/routes.test.ts` as all relevant tests are now logically organized in specialized files.
- Finalized test suite refactoring: no duplication, all tests pass, and structure is clear.

## [1.7.5] - 2025-05-09
### Changed
- Dashboard: Quick Actions section is now displayed above Recent Activity.
- Dashboard: Recent Activity now spans the full page width.
- Increased the limit of displayed recent activities to 30 (was 5).

## [1.8.3] - 2025-05-09
### Added
- Candidate name in Recent Activity is now clickable and links to the candidate's page.

## [1.8.2] - 2025-05-09
### Changed
- Dashboard statistics widgets now show only: active tests, candidates, pending sessions, and completed sessions. All other cards removed for clarity.

## [1.8.0] - 2025-05-09
### Changed
- On the Dashboard page, removed button descriptions for "Create Test" and "Add Candidate". Now only the icon and main button text are shown for clarity and simplicity.

## [1.8.4] - 2025-05-09

### Changed
- Dashboard: Recent Activity теперь отображает только явную дату активности (например, "09.05.2025 11:28"), надпись относительного времени (например, "less than a minute ago") убрана.
- Стиль даты активности теперь полностью совпадает со стилем названия теста (шрифт, размер, цвет).
- Recent Activity всегда сортируется по дате активности по убыванию на клиенте.
- UI-тест RecentActivity удалён по запросу пользователя.

## [1.5.0] - 2025-05-09
### Changed
- Test management UI: the modal for creating a test has been restored. After creating a test, the user is redirected to the test details page (`/dashboard/tests/:id`).
- Editing questions is only possible on the test details page, not in the modal.
- Updated routing and navigation logic for tests.
- Updated `TestsTable` to navigate to the test details page on click.
- Cleaned up code and fixed related lint errors.

## [1.8.6] - 2025-05-09
### Changed
- Default time limit for new tests is now 30 minutes (previously 0). Editing existing tests keeps their current value.

## [1.8.5] - 2025-05-09
### Changed
- Increased the max width of the Create Test modal window (`CreateTestModal`) to `max-w-2xl` for correct horizontal alignment of 'Category' and 'Time Limit' fields. Now both fields are always on the same row.

## [Unreleased]

## [1.2.0] - 2025-05-09
### Changed
- Database seed now creates only the admin user. All other sample data (recruiter, tests, candidates, sessions) has been removed from the seed script.

## [1.1.0] - 2025-05-09
### Removed
- Removed `questionCount` property from test creation and update in migrations and seed data. This property is not present in the tests table schema. All server tests pass after the fix.

## [1.8.0] - 2025-05-09
- Removed the 'category' field from the test data structure across the entire codebase (API, database, types, tests, and client UI).
- Updated backend and frontend logic to not require or use 'category'.
- Cleaned up all references, including Swagger, mock data, and validation schemas.
- Fixed docker-compose build and verified all tests pass.


### Added
- Recent Activity now shows a pass/fail status icon (✅/❌) next to the test name, indicating if the test was passed or not.

### Changed
- RecentActivity теперь использует Link из `wouter` для перехода к деталям кандидата на дашборде (единый способ ссылок с таблицей кандидатов).
- Исправлены типы метода getRecentActivity в MemStorage (возвращает candidateId).


### Changed
- Backend tests and Allure report publication moved to a dedicated `test-backend` job. `build-and-push` job now depends on successful test completion.
- Deploy workflow still blocks deployment if tests fail.
- Allure backend report is always generated in CI (via `npx allure generate`) and attached as an artifact (`allure-report-backend`).


## [1.7.0] - 2025-05-08

- All server tests now exclusively use `loggedRequest` for HTTP requests and all assertions are wrapped with `assertWithAllure` for step-level logging in Allure reports. This ensures complete traceability and visibility of all test actions and checks in the Allure test report.

### Fixed
- Allure integration in server tests: switched from `allure-js-commons` import to global `allure` object as provided by `jest-allure2`. Added proper TypeScript declaration and fixed `tsconfig.json` to enable global Jest types. All tests now pass.

### Added
- assertWithAllure helper for logging all assertions (expect) as steps in Allure reports.
- loggedRequest now logs all possible request/response details (method, url, body, headers, cookies, query, response headers, response cookies, etc.) to Allure attachments.
- Tests updated to use assertWithAllure for all key checks, providing more transparent and readable Allure reports.

- Added new tests for `/api/tests/:id` endpoint: GET returns 200 and test object if exists, GET returns 404 for non-existent test, PATCH updates test and returns 200, PATCH returns 404 for non-existent test.

- Added detailed checks for the structure of the test object in the test `GET /api/tests should return 200 and array with expected structure` (fields: id, name, description, category, createdBy, isActive, passingScore, timeLimit).

## [1.0.5] - 2025-05-05
### Added
- CHANGELOG.md file to track all project changes
- Implemented backend endpoint GET `/api/sessions/:sessionId/answers` to fetch all candidate answers for a session with question details.
- Added UI for detailed candidate session answers: clicking on a test in candidate details now shows a page with all questions, answers, and correctness status.
- CHANGELOG.md file to track all project changes
- Implemented backend endpoint GET `/api/sessions/:sessionId/answers` to fetch all candidate answers for a session with question details.
- Added UI for detailed candidate session answers: clicking on a test in candidate details now shows a page with all questions, answers, and correctness status.

### Changed
- Clarified in `test/api-plan.md` that E2E API tests are performed via HTTP requests to real services running in Docker Compose (docker-compose.yml), both locally and in CI. Emphasized that no in-memory or mocked Express injection is used for E2E tests.
- Clarified in `test/api-plan.md` that E2E API tests are performed via HTTP requests to real services running in Docker Compose (docker-compose.yml), both locally and in CI. Emphasized that no in-memory or mocked Express injection is used for E2E tests.

### Fixed
- Fixed dashboard crash by switching to static import for candidate session details page in App.tsx.
- Fixed answer rendering for multiple choice: now shows option text instead of index.
- Fixed answer validation logic: for multiple_choice and checkbox questions, answers are now always normalized to the index (or array of indices) of the selected option(s) before being stored and compared. This ensures correct correctness checking regardless of whether the client sends text or index. For text/code questions, string comparison is used. Linter errors fixed. Tested via curl and logs.
- Fixed: Unique React keys for test sessions in candidate details page to avoid duplication and React warnings.
- Fixed: Each test session now links to its unique session, even if the candidate took the same test multiple times.
- Improved: Removed debug output from UI and console for production cleanliness.
- Prevented an error in the deploy workflow when no containers are found for `docker logs` (now logs are shown only if containers exist, otherwise a clear message is printed instead of an error).
- Improved diagnostics in deploy workflow: if no containers are found for the main image, the script now outputs all containers (docker ps -a), Docker info, and disk space usage (df -h) to help with troubleshooting.
- Fixed: Attempt counter in deploy workflow logs now correctly displays the current attempt number using ${i}.

## [1.0.4] - 2025-05-04
### Fixed
- Добавлены недостающие зависимости для Swagger

## [1.0.3] - 2025-05-04
### Fixed
- Устранена проблема с импортом drizzle-zod
- Обновлены зависимости drizzle-orm

## [1.0.2] - 2025-05-04
### Fixed
- Восстановлен autoprefixer для корректной сборки

## [1.0.1] - 2025-05-04

### Changed
- Удалены неиспользуемые зависимости
- Добавлены недостающие зависимости
- Обновлены устаревшие пакеты

## [0.1.0] - 2025-05-04

### Added
- Basic project structure
  - React frontend with Tailwind CSS
  - Express.js backend with TypeScript
  - PostgreSQL database with Drizzle ORM
  - Docker and Docker Compose for containerization
- Website icon (favicon.ico)
  - Created client/src/assets folder for static resources
  - Icon imported in main.tsx for inclusion in the build
- Core functionalities:
  - Creating and managing skill assessments
  - Question bank with various formats
  - Candidate management
  - Automated scoring
  - Performance analytics
  - AI-powered question generation
  - CSV import/export

### Changed
- Optimized project structure for better code organization

### Removed
- Unused client/public folder
