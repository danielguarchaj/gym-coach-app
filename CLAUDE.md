# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GymCoach — a SaaS app for gym coaches to track trainee workout progress. Two roles: **Coach** (views all trainees, progress charts per exercise/body part) and **Trainee** (logs workout sessions: exercise, sets, reps, weight, rest time).

See `PROPOSAL.md` for full architecture, data model, API surface, and implementation phases.

## Language Rules

- **App UI text**: Spanish, exclusively via `frontend/src/i18n/es.json` (never hardcode strings in components)
- **Everything else**: English — code, variable names, file names, folder names, comments, docs

## Stack

- **Frontend**: React + TypeScript + Vite, hosted on GitHub Pages (deployed via GitHub Actions)
- **Backend**: AWS Lambda (TypeScript, Node 20.x) behind API Gateway REST — source lives in `cdk/backend/src/`
- **Auth**: Amazon Cognito User Pools (JWT, coach/trainee roles via custom attributes; email verification required)
- **Database**: DynamoDB (4 tables: `Users`, `Workouts`, `ExerciseCatalog`, `Invites`)
- **Infra**: AWS CDK (TypeScript) — `cdk deploy --all` / `cdk destroy --all`
- **CI/CD**: GitHub Actions

## Repository Layout

```
gym-coach-app/
├── cdk/                  — CDK stacks + Lambda handlers (bundled by esbuild at deploy time)
│   ├── lib/              — auth-stack, database-stack, api-stack, seed-stack
│   └── backend/src/      — Lambda source: handlers/, services/, types/, seed/
└── frontend/             — React SPA (pages, components, typed API client)
```

## Commands

```bash
# Infrastructure + backend (Lambda bundled by CDK esbuild, no separate build step)
cd cdk && npm install && npx cdk deploy --all

# Frontend
cd frontend && npm run dev        # local dev
cd frontend && npm run build      # production build
```
