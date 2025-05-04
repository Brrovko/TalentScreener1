# Changelog

All notable changes to the SkillChecker project will be documented in this file.

This format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CHANGELOG.md file to track all project changes

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
