# Changelog

All notable changes to GymCoach are documented here.
Format: `[version] YYYY-MM-DD — description`. Unreleased work goes under `[Unreleased]`.

Each entry notes which task(s) it closes so future agents can cross-reference the task list.

---

## [Unreleased]

### Phase 1 — Foundation ✅ COMPLETE
- [x] Task 1: Scaffold monorepo (cdk/, backend/, frontend/)
- [x] Task 2: CDK auth-stack — Cognito User Pool
- [x] Task 3: CDK database-stack — DynamoDB tables
- [x] Task 4: CDK seed-stack — exercise catalog (~60 exercises)
- [x] Task 5: CDK api-stack — API Gateway + Lambda skeleton
- [x] Task 6: Frontend — Vite + React + TypeScript setup
- [x] Task 7: Frontend i18n — useTranslation hook + JSON files
- [x] Task 8: Frontend auth screens — Login + Register
- [x] Task 9: Backend auth handlers — register + Cognito integration
- [x] Task 10: GitHub Actions — CI/CD workflows

### Phase 2 — Trainee Flow ✅ COMPLETE
- [x] Task 11: Backend — exercises handler (GET /exercises)
- [x] Task 12: Backend — sessions handlers (POST/GET /sessions)
- [x] Task 13: Frontend — exercise catalog picker
- [x] Task 14: Frontend — session logging form + history
- [x] Task 15: Trainee bottom navigation + routing

### Phase 3 — Coach Dashboard ✅ COMPLETE
- [x] Task 16: Backend — trainees + progress handlers
- [x] Task 17: Backend — invites handlers
- [x] Task 18: Frontend — coach trainee list screen
- [x] Task 19: Frontend — per-trainee history + progress chart
- [x] Task 20: Frontend — invite flow + Web Share API
- [x] Task 21: Coach bottom navigation + routing

### Phase 4 — Polish & Deploy ✅ COMPLETE
- [x] Task 22: Framer Motion animations + UI polish
- [x] Task 23: Profile screen + weight unit preference
- [x] Task 24: End-to-end smoke test + README

---

## Agent Handoff Notes

> Updated 2026-07-22 — ALL 24 TASKS COMPLETED. Frontend builds cleanly.

### What exists

#### Infrastructure (cdk/)
- `auth-stack.ts` — Cognito User Pool: email sign-in, SRP auth, custom attrs (`custom:role`, `custom:coachId`), no client secret
- `database-stack.ts` — 4 DynamoDB tables: Users (GSI: coachId-index), Workouts, ExerciseCatalog (GSI: bodyPart-index), Invites (TTL: expiresAt)
- `api-stack.ts` — API Gateway REST + 6 NodejsFunction Lambdas (auth, invites, sessions, trainees, exercises, profile); Cognito JWT authorizer on all routes except `/invites/{token}/validate` (public); CORS enabled
- `seed-stack.ts` — CDK custom resource (Lambda-backed) seeds ~60 exercises on first deploy; skips if already seeded

#### Backend (backend/src/)
- `types/index.ts` — all shared types: User, WorkoutSession, Exercise, Invite, SetRecord, etc.
- `services/dynamo.ts` — DynamoDBDocumentClient + Tables env-var map
- `services/cognito.ts` — CognitoIdentityProviderClient + pool config
- `services/response.ts` — ok/created/badRequest/forbidden/notFound/gone/serverError helpers with CORS headers
- `handlers/auth.ts` — POST /auth/register: creates DynamoDB user record, validates invite token, links trainee to coach
- `handlers/invites.ts` — POST /invites (coach): generates UUID token, 7-day TTL; GET /invites/{token}/validate (public)
- `handlers/sessions.ts` — POST /sessions (trainee): validates exercises, stores weights in kg; GET /sessions (paginated, cursor-based); GET /sessions/{id}
- `handlers/exercises.ts` — GET /exercises (?bodyPart filter via GSI); GET /exercises/{id}
- `handlers/trainees.ts` — GET /trainees (GSI coachId-index); GET /trainees/{id} (with last session + total count); GET /trainees/{id}/sessions (paginated); GET /trainees/{id}/progress (?exerciseId, ?from, ?to → dataPoints for chart)
- `handlers/profile.ts` — GET /profile; PATCH /profile (name, weightUnit)
- `seed/exercises.ts` — ~60 exercises across 9 body parts with es/en names
- `seed/seedHandler.ts` — CDK custom resource Lambda; skips if table not empty

#### Frontend (frontend/src/)
- `index.css` — CSS vars: violet primary (#6C3CE1), orange secondary (#F97316), lavender background (#F5F0FF), glassmorphism shadows
- `lib/amplify.ts` — Amplify v6 configured from VITE_COGNITO_USER_POOL_ID + VITE_COGNITO_CLIENT_ID
- `i18n/es.json` — all Spanish UI strings (auth, coach, trainee, exercises, profile, nav, invite, common)
- `i18n/index.ts` — I18nProvider + useTranslation hook (dot-notation keys, localStorage locale)
- `hooks/useAuth.ts` — AuthProvider + useAuth: Amplify v6 signIn/signUp/signOut, session restore on load, JWT stored in localStorage
- `hooks/useWeightUnit.ts` — toDisplay(kg) / toStorage(value), persisted in localStorage
- `api/index.ts` — typed fetch client with auto JWT injection; api.get/post/patch
- `api/exercises.ts, sessions.ts, trainees.ts, invites.ts` — typed API clients per resource
- `pages/Login.tsx` — glassmorphism card, Framer Motion fade+slide, Cognito SRP via Amplify
- `pages/Register.tsx` — role selector (Coach/Trainee), invite banner when opened from invite link
- `pages/InviteLanding.tsx` — validates token (GET /invites/{token}/validate), shows coach name, navigates to /register with inviteToken in state
- `pages/Profile.tsx` — avatar, role badge, kg/lb toggle, logout
- `pages/coach/Trainees.tsx` — avatar list, last workout (relative date), session count, skeleton loading, empty state
- `pages/coach/TraineeDetail.tsx` — History tab (expandable sessions) + Progress tab (Recharts LineChart, date range, PR dot in green)
- `pages/coach/Invite.tsx` — generates invite URL, Web Share API (falls back to clipboard copy)
- `pages/trainee/Log.tsx` — ExercisePicker integration, sets×reps×weight table, kg/lb aware, submit to API
- `pages/trainee/History.tsx` — paginated session list, expandable set detail, weight in user's preferred unit
- `components/ExercisePicker.tsx` — bottom sheet, body part filter chips, search, spring animation
- `components/BottomNav.tsx` — Framer Motion active indicator (layoutId), safe-area inset support
- `components/PageTransition.tsx` — fade+slide, used in layouts via AnimatePresence
- `layouts/CoachLayout.tsx` — Outlet + AnimatePresence page transitions + BottomNav
- `layouts/TraineeLayout.tsx` — Outlet + AnimatePresence page transitions + BottomNav
- `App.tsx` — hash routing, nested layout routes, RoleGuard, session restore loading state

#### CI/CD (.github/workflows/)
- `deploy-frontend.yml` — push to main → npm build → GitHub Pages (uses VITE_ secrets)
- `deploy-infra.yml` — push to main (cdk/** or backend/**) → cdk deploy --all (uses AWS_ secrets)

### Key decisions (do not change without updating PROPOSAL.md)
- Weight always stored in **kg** in DynamoDB; lb conversion is frontend-only
- Hash routing (`HashRouter`) required for GitHub Pages (no server-side routing)
- Cognito: SRP auth flow, no client secret, `custom:role` attribute set at signup
- All UI strings through `t()` — never hardcode Spanish in components
- Invite token TTL: 7 days (DynamoDB TTL auto-deletes expired tokens)
- `POST /auth/register` called by frontend after every Cognito signUp to create DynamoDB user record
- `/invites/{token}/validate` is the only public (no-auth) API route

### Environment variables / secrets needed
- GitHub Actions: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- GitHub Actions + local `.env.local`: `VITE_API_BASE_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`
- Lambda env (auto-set by CDK): `USERS_TABLE`, `WORKOUTS_TABLE`, `EXERCISES_TABLE`, `INVITES_TABLE`, `USER_POOL_ID`, `USER_POOL_CLIENT_ID`
- Lambda env (manual, set in CDK env): `APP_BASE_URL` — the GitHub Pages URL for invite links (e.g. `https://username.github.io/gym-coach-app`)

### What's NOT done yet (post-MVP)
- Trainee own progress chart (`/trainee/progress` page is a stub — uses same data as coach view but for own account)
- Testing (no unit or integration tests)
- Training programs feature
- Push notifications
- Desktop dashboard
