# GymCoach — MVP Proposal (v2)

## The Problem

Gym coaches track trainee progress through scattered notes or memory. There's no centralized way to see all trainees' workout history, compare progress over time, or quickly identify who is improving in a specific exercise or muscle group. This creates friction for the coach and a poor feedback loop for the trainee.

---

## Product Vision

A mobile-first SaaS app where:
- **Trainees** log their workout sessions (exercises, sets, reps, weight, rest time).
- **Coaches** get a dashboard to see all their trainees, review session history, and visualize progress per exercise and muscle group over time.

---

## Roles

| Role | Core Capabilities |
|---|---|
| **Coach** | Invite trainees via shareable link (WhatsApp/email), view all trainees, review history per trainee, view progress charts per exercise |
| **Trainee** | Log workout sessions, view own progress, access the exercise catalog |

---

## MVP Scope

### In Scope
- User registration and login with a custom screen
- Coach generates and shares an invite link (Web Share API → WhatsApp, email, etc.)
- Predefined exercise catalog classified by muscle group and category
- Trainee logs sessions: exercise from catalog, sets × reps × weight (kg/lb with conversion), rest time
- Coach dashboard: trainee list, per-trainee session history, progress chart per exercise
- Mobile-first UI with modern design and animations
- i18n via custom hook + JSON files (Spanish by default, structure ready for more languages)

### Out of Scope (Post-MVP)
- Native mobile app (iOS/Android)
- Push notifications
- Coach comments on trainee sessions
- Predefined training programs (planned — exercise catalog is already structured to support this)
- Payments / subscription tiers
- Advanced desktop dashboard

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Client (SPA, Mobile-First)                 │
│              React + TypeScript + Vite                      │
│              Hosting: GitHub Pages                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│              Amazon API Gateway (REST /v1/*)                 │
│           Cognito JWT Authorizer on all routes               │
└──────────┬───────────────────────────────┬──────────────────┘
           │                               │
┌──────────▼──────────┐       ┌────────────▼──────────────────┐
│  AWS Lambda         │       │     Amazon Cognito             │
│  (TypeScript)       │       │  User Pool + App Client        │
│  Business logic     │       │  Custom attribute: role        │
└──────────┬──────────┘       └───────────────────────────────┘
           │
┌──────────▼──────────────────────────────┐
│           Amazon DynamoDB               │
│  Table: Users                           │
│  Table: Workouts                        │
│  Table: ExerciseCatalog  (seed data)    │
│  Table: Invites                         │
└─────────────────────────────────────────┘
```

---

## Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast to scaffold, type-safe, great ecosystem |
| Routing | React Router v6 | Standard, deep link support for invite flow |
| Animations | Framer Motion | Declarative animations, mobile-friendly |
| Charts | Recharts | Lightweight, responsive, easy progress line charts |
| i18n | Custom hook + JSON files | No extra dependencies, extensible to more languages |
| Hosting | GitHub Pages + GitHub Actions | Zero AWS config, automatic deploy on push |
| Auth | Amazon Cognito User Pools | JWT, custom attributes for role, custom React login screen |
| API | API Gateway REST + Lambda TypeScript (Node 20.x) | Serverless, scales to zero, free-tier friendly |
| Database | Amazon DynamoDB | Serverless, generous free tier, access-pattern queries |
| Infra | AWS CDK (TypeScript) | Same language as backend |
| CI/CD | GitHub Actions | Free, deploys to GitHub Pages + runs CDK deploy |

---

## Design & UI

### Color Palette

```
Primary:    #6C3CE1  (electric violet — energy, motivation)
Secondary:  #F97316  (vibrant orange — action, achievement)
Background: #F5F0FF  (very light lavender — modern, not boring)
Surface:    #FFFFFF  (cards and modals)
Text:       #1A1A2E  (near-black with blue tint)
Muted:      #8B8FA8  (secondary text)
Success:    #10B981  (green for PRs / records)
```

### UI Principles
- **Mobile-first**: designed for 375px+ screens, bottom tab bar navigation
- **Subtle glassmorphism**: cards with `backdrop-filter: blur` and semi-transparent borders
- **Animations**: page transitions via Framer Motion, micro-animations on buttons, animated chart entries
- **Typography**: Inter or Plus Jakarta Sans — modern, readable on mobile
- **Bottom navigation**: Coach sees Trainees / Progress / Profile; Trainee sees Log / History / Profile

### Screens (MVP)

```
Auth
├── /login              — Custom login (email + password)
└── /register           — Registration (name, email, password, role)

Coach
├── /coach/trainees              — Trainee list with avatar/initial, last workout date
├── /coach/trainees/:id          — Trainee profile + session history
├── /coach/trainees/:id/progress — Exercise selector → weight-over-time chart
└── /coach/invite                — Generate link + share button (Web Share API)

Trainee
├── /trainee/log                 — Session form: pick exercises from catalog, add sets
├── /trainee/history             — List of past sessions
└── /trainee/progress            — Own progress chart per exercise

Shared
└── /invite/:token               — Invite landing page, redirects to register with coach pre-linked
```

---

## i18n

```
frontend/src/i18n/
├── es.json          — Spanish (default language)
├── en.json          — English (placeholder for future)
└── index.ts         — useTranslation hook + context
```

Usage in components:
```tsx
const { t } = useTranslation()
<h1>{t('coach.trainees.title')}</h1>
```

All UI-visible strings live in the JSON files. Code, file names, variable names, and comments stay in English.

---

## Data Model (DynamoDB)

### Table: `Users`
| PK | SK | Attributes |
|---|---|---|
| `USER#{userId}` | `PROFILE` | email, name, role (`COACH`/`TRAINEE`), coachId (trainees only), weightUnit (`kg`/`lb`), createdAt |

GSI: `coachId-index` — lets the coach list all their trainees in a single query.

### Table: `Workouts`
| PK | SK | Attributes |
|---|---|---|
| `TRAINEE#{traineeId}` | `SESSION#{isoDate}#{uuid}` | date, durationMin, notes, exercises (list) |

**Exercise object** (nested in each session):
```json
{
  "catalogId": "exercise-uuid",
  "name": "Bench Press",
  "bodyPart": "Chest",
  "sets": [
    { "reps": 10, "weightKg": 20.0, "restSeconds": 90 },
    { "reps": 8,  "weightKg": 22.5, "restSeconds": 90 }
  ]
}
```

> **Design decision**: weight is always stored in **kg** in the database. Conversion to lb happens exclusively in the frontend based on the user's preference. This keeps queries and historical comparisons clean.

**Key access patterns:**
- All sessions for a trainee → `pk = TRAINEE#{id}`, `sk begins_with SESSION#`
- Sessions in date range → `pk = TRAINEE#{id}`, `sk between SESSION#{start} and SESSION#{end}`
- Progress data for a chart → query by trainee + filter by `exercises[].catalogId` in Lambda

### Table: `ExerciseCatalog`
| PK | SK | Attributes |
|---|---|---|
| `EXERCISE#{exerciseId}` | `METADATA` | name (es/en), bodyPart, category, primaryMuscle, secondaryMuscles, equipment, isCustom, coachId (null if global) |

GSI: `bodyPart-index` — list all exercises for a given muscle group.

**Body part categories**: Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Core, Cardio

**Seed data**: ~60 global exercises via CDK custom resource on first deploy. This table is also structured to support **training programs** in the future — a program is simply a collection of exercises with suggested sets/reps.

### Table: `Invites`
| PK | SK | Attributes |
|---|---|---|
| `INVITE#{token}` | `METADATA` | coachId, coachName, expiresAt (TTL), status (`pending`/`used`) |

DynamoDB TTL on `expiresAt` — expired invites are automatically deleted (7-day expiry).

---

## Invite Flow

```
Coach taps "Invite Trainee"
        │
        ▼
POST /invites → Lambda generates unique token → saved in Invites table (TTL 7 days)
        │
        ▼
Frontend receives link: https://[user].github.io/gym-coach-app/invite/{token}
        │
        ▼
Coach taps "Share" → Web Share API → native OS share sheet opens
(WhatsApp, iMessage, email, whatever the user has installed)
        │
        ▼
Trainee opens link → /invite/:token page
        │
GET /invites/:token/validate → Lambda checks token is valid, returns coachName
        │
        ▼
Trainee completes registration → POST /auth/register?inviteToken={token}
Lambda creates user in Cognito + Users table with coachId already linked
        │
        ▼
Token marked as `used` in Invites table
```

---

## API Surface

```
# Auth
POST   /auth/register              — create account (role: COACH/TRAINEE, optional inviteToken)
POST   /invites                    — coach: generate invite token
GET    /invites/:token/validate    — public: validate token and return coach name

# Coach
GET    /trainees                   — list all trainees for the authenticated coach
GET    /trainees/:id               — trainee profile + summary
GET    /trainees/:id/sessions      — session history (paginated)
GET    /trainees/:id/progress      — chart data (?exerciseId=xxx&from=date&to=date)

# Trainee
POST   /sessions                   — log a new workout session
GET    /sessions                   — own session history (paginated)
GET    /sessions/:id               — session detail
GET    /progress                   — own progress (?exerciseId=xxx)

# Catalog
GET    /exercises                  — list exercises (?bodyPart=Chest)
GET    /exercises/:id              — exercise detail

# Profile
GET    /profile                    — authenticated user data
PATCH  /profile                    — update (name, weight unit kg/lb)
```

---

## CDK Infrastructure

```
cdk/
├── bin/app.ts
└── lib/
    ├── auth-stack.ts        — Cognito User Pool, App Client, custom attributes
    ├── database-stack.ts    — DynamoDB tables + GSIs + TTL config
    ├── api-stack.ts         — API Gateway, Lambda functions, IAM roles
    └── seed-stack.ts        — Custom resource to seed ExerciseCatalog (~60 exercises)
```

Single `cdk deploy --all` provisions everything. `cdk destroy --all` tears it down cleanly.

---

## Repository Structure

```
gym-coach-app/
├── cdk/                          — CDK infrastructure (TypeScript)
│   ├── bin/app.ts
│   └── lib/
│       ├── auth-stack.ts
│       ├── database-stack.ts
│       ├── api-stack.ts
│       └── seed-stack.ts
│
├── backend/                      — Lambda handlers
│   └── src/
│       ├── handlers/             — auth, invites, trainees, sessions, exercises, profile
│       ├── services/             — dynamo.ts, cognito.ts, invites.ts
│       └── types/                — User, Session, Exercise, Invite
│
├── frontend/                     — React SPA
│   └── src/
│       ├── i18n/                 — es.json, en.json, useTranslation.ts
│       ├── pages/                — Login, Register, Coach/*, Trainee/*, Invite
│       ├── components/           — ProgressChart, SessionCard, ExerciseSelector, BottomNav
│       ├── api/                  — typed fetch client per resource
│       └── hooks/                — useAuth, useTranslation, useWeightUnit
│
├── PROPOSAL.md
├── CLAUDE.md
└── .github/
    └── workflows/
        ├── deploy-frontend.yml   — build + push to GitHub Pages
        └── deploy-infra.yml      — cdk deploy on merge to main
```

---

## Implementation Phases

### Phase 1 — Foundation (1–2 days)
- CDK: Cognito, DynamoDB tables (Users, Workouts, ExerciseCatalog, Invites)
- Seed: ~60 classified exercises
- Frontend: custom Login and Register screens + Cognito integration

### Phase 2 — Trainee Flow (2–3 days)
- Lambda: POST /sessions, GET /sessions, GET /exercises
- Frontend: exercise picker from catalog, session logging form (sets/reps/weight with kg/lb conversion), history list

### Phase 3 — Coach Dashboard (2–3 days)
- Lambda: GET /trainees, GET /trainees/:id/sessions, GET /trainees/:id/progress, POST /invites
- Frontend: trainee list, per-trainee history, progress chart (Recharts), invite flow with Web Share API

### Phase 4 — Deploy & Polish (1 day)
- GitHub Actions: frontend build → GitHub Pages deploy
- GitHub Actions: CDK deploy on merge to main
- Framer Motion animations, mobile UI refinement, real-device testing

---

## Cost Estimate (Personal AWS Account)

| Service | Free Tier | Expected MVP Usage |
|---|---|---|
| Lambda | 1M requests/month | Well within free tier |
| API Gateway | 1M calls/month | Well within free tier |
| DynamoDB | 25 GB, 200M requests | Well within free tier |
| Cognito | 50,000 MAU | Well within free tier |
| GitHub Pages | Free | — |

**Effective cost for demo/MVP: $0/month.**

---

## Decisions Made

| # | Decision |
|---|---|
| 1 | Weight stored in kg in DB; lb conversion handled exclusively in the frontend |
| 2 | Separate `ExerciseCatalog` table, ~60 seeded exercises, structured for future training programs |
| 3 | Invite via shareable link + Web Share API (WhatsApp, email, etc.), token TTL 7 days |
| 4 | Frontend hosted on GitHub Pages |
| 5 | Custom React login/register screen (not Cognito Hosted UI) |
| 6 | App UI in Spanish by default via `useTranslation` hook + JSON files; code/files/docs in English |
| 7 | Mobile-first: bottom tab navigation, designed for 375px+ screens |
| 8 | Palette: electric violet + orange + lavender background; glassmorphism + Framer Motion |
