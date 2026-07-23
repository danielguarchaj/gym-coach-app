# GymCoach

A mobile-first SaaS app for gym coaches to track trainee workout progress.

**Two roles:** Coach (views all trainees, progress charts) · Trainee (logs workout sessions)

---

## Local Development
-

### Prerequisites
- Node 20+
- AWS CLI configured with your personal account
- CDK bootstrapped: `cd cdk && npx cdk bootstrap`

### 1. Deploy infrastructure
```bash
cd cdk
npm install
npx cdk deploy --all
```

Copy the outputs (UserPoolId, UserPoolClientId, ApiUrl) — you'll need them in step 3.

### 2. Run the frontend locally
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment variables
Create `frontend/.env.local`:
```
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

---

## GitHub Actions Secrets & Variables

Add these to **Repository secrets** (Settings → Secrets and variables → Actions → Repository secrets):

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | Personal AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Personal AWS secret key |
| `AWS_REGION` | e.g. `us-east-1` |
| `VITE_API_BASE_URL` | API Gateway URL from CDK output |
| `VITE_COGNITO_USER_POOL_ID` | From CDK output |
| `VITE_COGNITO_CLIENT_ID` | From CDK output |

Add this to **Repository variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Description |
|---|---|
| `APP_BASE_URL` | GitHub Pages URL, e.g. `https://username.github.io/gym-coach-app` — used by the invite link Lambda |

> **Important:** Use Repository-level secrets/variables, not Environment-level. Environment secrets are only available to jobs that declare `environment: <name>` in the workflow, which the infrastructure pipeline does not.

---

## Repository Structure

```
gym-coach-app/
├── cdk/                  # AWS CDK infrastructure + Lambda handlers (TypeScript)
│   ├── lib/
│   │   ├── auth-stack.ts       # Cognito User Pool
│   │   ├── database-stack.ts   # DynamoDB tables + GSIs
│   │   ├── api-stack.ts        # API Gateway + Lambda functions
│   │   └── seed-stack.ts       # Exercise catalog seed data
│   └── backend/src/            # Lambda source (bundled by CDK esbuild at deploy time)
│       ├── handlers/           # auth, invites, sessions, trainees, exercises, profile
│       ├── services/           # DynamoDB + Cognito clients, response helpers
│       ├── types/              # Shared TypeScript types
│       └── seed/               # ~60 exercise seed data + seed Lambda
└── frontend/             # React SPA (Vite + TypeScript)
    └── src/
        ├── i18n/               # es.json (Spanish), en.json (placeholder)
        ├── pages/              # Login, Register, coach/*, trainee/*, Invite, Profile
        ├── components/         # BottomNav, ExercisePicker, PageTransition
        ├── layouts/            # CoachLayout, TraineeLayout (with BottomNav)
        ├── hooks/              # useAuth, useTranslation, useWeightUnit
        └── api/                # Typed fetch clients per resource
```

---

## Destroy all AWS resources
```bash
cd cdk && npx cdk destroy --all
```
