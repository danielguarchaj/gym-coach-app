# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GymCoach — a SaaS app for gym coaches to track trainee workout progress. Two roles: **Coach** (views all trainees, progress charts per exercise/body part) and **Trainee** (logs workout sessions: exercise, sets, reps, weight, rest time).

See `PROPOSAL.md` for full architecture, data model, API surface, and implementation phases.

## Language Rules

- **App UI text**: Spanish, exclusively via `frontend/src/i18n/es.json` (never hardcode strings in components)
- **Everything else**: English — code, variable names, file names, folder names, comments, docs

## Stack

- **Frontend**: React + TypeScript + Vite, hosted on S3 + CloudFront (or GitHub Pages for fast demo)
- **Backend**: AWS Lambda (TypeScript, Node 20.x) behind API Gateway REST
- **Auth**: Amazon Cognito User Pools (JWT, coach/trainee roles via custom attributes)
- **Database**: DynamoDB (two tables: `Users`, `Workouts`)
- **Infra**: AWS CDK (TypeScript) — `cdk deploy --all` / `cdk destroy --all`
- **CI/CD**: GitHub Actions

## Repository Layout (target structure)

```
gym-coach-app/
├── cdk/          — CDK stacks: auth-stack, api-stack, frontend-stack
├── backend/      — Lambda handlers and DynamoDB service layer
└── frontend/     — React SPA (pages, components, typed API client)
```

## Commands (once scaffolded)

```bash
# Infrastructure
cd cdk && npm run build && cdk deploy --all

# Backend
cd backend && npm run build && npm test

# Frontend
cd frontend && npm run dev        # local dev
cd frontend && npm run build      # production build
```
