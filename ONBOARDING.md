# GymCoach — Onboarding Guide

This guide covers three setup tasks you need to do after deploying the infrastructure for the first time:

1. Register the first coach account
2. Populate the exercise catalog (automatic)
3. Invite trainees

---

## 1. Exercise Catalog — Automatic on Deploy

The ~60 exercise seed data is loaded automatically by a CDK Custom Resource Lambda the first time `cdk deploy --all` runs. You do not need to do anything manually.

**To verify it worked**, call the exercises endpoint after deploy:

```
GET {VITE_API_BASE_URL}/v1/exercises
Authorization: Bearer <access-token>
```

Or log in as a coach in the app and open the exercise picker in the Log session page — exercises should appear there.

**To re-seed** (e.g. after adding exercises to `cdk/backend/src/seed/exercises.ts`), bump the `resourceVersion` property in `cdk/lib/seed-stack.ts` and redeploy:

```ts
// cdk/lib/seed-stack.ts
properties: { resourceVersion: '2' },  // was '1'
```

---

## 2. Register the First Coach

The coach account is created through the app's registration screen — there is no separate admin step.

### Steps

1. Open the app (`http://localhost:5173` for local dev, or your GitHub Pages URL).
2. Click **Registrarse** on the login screen.
3. Fill in:
   - **Nombre**: your name
   - **Email**: your email address
   - **Contraseña**: minimum 8 characters, must include uppercase, lowercase, and a digit (e.g. `MiPass123`)
4. Select the **Coach** role (the selector appears when there is no invite token in the URL).
5. Tap **Registrarse**.

**Email verification step:** Cognito sends a 6-digit confirmation code to your email. The app automatically advances to a second screen asking for this code. Enter the code and tap **Verificar y entrar**. If you entered the wrong email, tap **← Volver** to go back.

After verification you are logged in and land on the Coach dashboard (Alumnos tab).

### Password policy (enforced by Cognito)

| Requirement | Value |
|---|---|
| Minimum length | 8 characters |
| Uppercase letter | Required |
| Lowercase letter | Required |
| Digit | Required |
| Symbol | Not required |

---

## 3. Invite a Trainee

Each invite link is single-use and expires after 7 days.

### Step 1 — Generate the invite link (Coach)

1. Log in as the coach.
2. Tap the **Invitar** tab in the bottom navigation.
3. Tap **Generar Enlace**.
4. The app generates a unique link and displays:
   - The full invite URL
   - The expiry date

### Step 2 — Share the link (Coach)

Tap **Compartir Enlace**:
- On mobile: triggers the native share sheet (WhatsApp, SMS, etc.)
- On desktop: copies the link to clipboard

The link format is:
```
{APP_BASE_URL}/#/invite/{uuid-token}
```

> **Note:** For local dev, `APP_BASE_URL` defaults to `https://example.github.io/gym-coach-app` (set in `cdk/backend/src/handlers/invites.ts`). Update the `APP_BASE_URL` environment variable in `cdk/lib/api-stack.ts` to match your deployed frontend URL (e.g. your GitHub Pages URL) so invite links resolve correctly when shared.

### Step 3 — Trainee registers via the link

1. Trainee opens the invite link in a browser.
2. The app shows: _"Únete al equipo de [Coach Name]"_ — this confirms the link is valid.
3. Trainee taps **Crear cuenta**.
4. The registration form opens with role pre-set to **Alumno** (cannot be changed).
5. Trainee fills in name, email, and password, then taps **Registrarse**.

On successful registration:
- A Cognito account is created for the trainee.
- A DynamoDB record is created with `coachId` pointing to the coach who generated the link.
- The invite token is marked as `used` and cannot be reused.
- The trainee lands on their Alumno dashboard.

### Step 4 — Coach sees the trainee

After the trainee registers, they appear automatically in the coach's **Alumnos** list. No manual approval is required.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| "Invite not found" on landing page | Token expired (>7 days) or already used | Coach generates a new link |
| "Invite already used" | Link was already claimed | Coach generates a new link |
| Registration fails with password error | Password doesn't meet Cognito policy | Use 8+ chars with uppercase, lowercase, and a digit |
| Verification code screen never appeared | Cognito auto-confirmed the account (shouldn't happen in prod) | Check Cognito User Pool settings; `autoVerify.email` should be `true` |
| "UserNotConfirmedException" after registration | User tried to log in before completing email verification | Open the app again, re-register with the same email — Cognito will re-send the code |
| Exercises list is empty | Seed Lambda didn't run or failed | Check CloudWatch logs for `SeedFunction`; redeploy with bumped `resourceVersion` |
| Invite link opens the wrong URL | `APP_BASE_URL` env variable not set in CDK | Set `APP_BASE_URL` as a GitHub Actions Variable (`vars.APP_BASE_URL`) in repo settings and redeploy |
