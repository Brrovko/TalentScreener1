# Changelog

All notable changes to the SkillChecker project will be documented in this file.

This format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CHANGELOG.md file to track all project changes
- Implemented backend endpoint GET `/api/sessions/:sessionId/answers` to fetch all candidate answers for a session with question details.
- Added UI for detailed candidate session answers: clicking on a test in candidate details now shows a page with all questions, answers, and correctness status.

### Changed
- Clarified in `test/api-plan.md` that E2E API tests are performed via HTTP requests to real services running in Docker Compose (docker-compose.yml), both locally and in CI. Emphasized that no in-memory or mocked Express injection is used for E2E tests.

### Fixed
- Fixed dashboard crash by switching to static import for candidate session details page in App.tsx.
- Fixed answer rendering for multiple choice: now shows option text instead of index.
- Fixed answer validation logic: for multiple_choice and checkbox questions, answers are now always normalized to the index (or array of indices) of the selected option(s) before being stored and compared. This ensures correct correctness checking regardless of whether the client sends text or index. For text/code questions, string comparison is used. Linter errors fixed. Tested via curl and logs.
- Fixed: Unique React keys for test sessions in candidate details page to avoid duplication and React warnings.
- Fixed: Each test session now links to its unique session, even if the candidate took the same test multiple times.
- Improved: Removed debug output from UI and console for production cleanliness.

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
