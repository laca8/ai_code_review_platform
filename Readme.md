# AI Code Review Platform

A SaaS platform that analyzes your codebase using AI and generates a comprehensive report covering bugs, security vulnerabilities, code smells, performance issues, best practices, and refactoring suggestions.

## What it does

Connect your GitHub account or upload a ZIP, and the platform will clone your repository, parse the code, and run it through an AI engine that returns detailed findings per file and line — with fix suggestions included.

**Analysis categories:**
- Bugs — null refs, type errors, uncaught exceptions
- Security Vulnerabilities — OWASP Top 10, exposed secrets, SQL injection
- Code Smells — duplicated code, god classes, long functions
- Performance Issues — N+1 queries, memory leaks, inefficient loops
- Best Practices — naming, SOLID principles, design patterns
- Refactoring Suggestions — structural improvements with code examples

## Tech Stack

- **Runtime:** Node.js (LTS)
- **Language:** TypeScript (strict mode)
- **Framework:** NestJS
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Queue:** Bull + Redis
- **Auth:** JWT + Passport (GitHub OAuth)
- **AI:** Anthropic Claude API

---

## Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── github-oauth.service.ts
│   │   └── jwt.strategy.ts
│   │
│   ├── users/
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   │
│   ├── repositories/
│   │   ├── repositories.controller.ts
│   │   ├── repositories.service.ts
│   │   └── github-api.service.ts
│   │
│   ├── analysis/
│   │   ├── analysis.controller.ts
│   │   ├── analysis.service.ts        # job dispatch
│   │   ├── analysis.processor.ts      # Bull worker
│   │   ├── ast-parser.service.ts
│   │   ├── chunker.service.ts
│   │   └── ai-reviewer.service.ts     # Claude API calls
│   │
│   └── reports/
│       ├── reports.controller.ts
│       └── reports.service.ts
│
├── entities/                          # TypeORM entities
│   ├── user.entity.ts
│   ├── repository.entity.ts
│   ├── analysis-job.entity.ts
│   ├── analysis-report.entity.ts
│   ├── issue.entity.ts
│   ├── issue-comment.entity.ts
│   ├── subscription.entity.ts
│   └── audit-log.entity.ts
│
├── common/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
│
└── config/
    ├── database.config.ts
    ├── redis.config.ts
    └── app.config.ts
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migrations
npm run migration:run

# Start in development mode
npm run start:dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/code_review
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
```