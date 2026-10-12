# PhysioTrack

PhysioTrack is a mobile app for home physiotherapy. Patients pick a focus area, browse exercise programs, and work through exercises one timed step at a time, with progress stored on the backend.

It is built with Expo and React Native. The Django API it talks to lives in [physio_track-backend](https://github.com/kaancakr/physio_track-backend).

## Features

- **Onboarding intake.** Collects full name, age range, gender, focus area (picked on a front/back body map: neck, shoulder, back, knee or mobility), weekly session goal and daily step goal.
- **Email sign-up with verification.** After sign-up the user enters a 6-digit code sent by email, and can resend it after a countdown. Log in and log out work with email and password.
- **Session handling.** The app stores JWT access and refresh tokens in `expo-secure-store` and refreshes the access token when it is about to expire or after a `401`. If the refresh fails, the user is signed out.
- **Dashboard.** Shows a greeting, a recommended program based on the user's focus area, and weekly-goal and daily-step widgets. These widgets currently use local sample data from `data/exercise-programs.ts`. A notifications screen is linked from the dashboard.
- **Programs, exercises, session and completion.**
  - The programs list supports search and a focus-area filter.
  - Opening a program lists its exercises with per-exercise progress.
  - The exercise detail screen shows steps, timing and notes.
  - The guided session runs a timer for each step. Each finished step is sent to the backend, and steps must be completed in order.
  - A completion screen ends the session.
- **Profile.** Shows account details and overall progress (programs, exercises and steps completed) from the backend. Users can edit their intake profile and choose a system, light or dark theme.
- **Localization.** English and Turkish (`locales/en.json`, `locales/tr.json`). The language comes from the device locale via `expo-localization`, with English as the fallback. Translations cover onboarding, auth and profile screens.
- **Response caching.** GET requests send `If-None-Match` and reuse the cached response when the server returns `304 Not Modified`.

Not finished yet:
- The "Sign in with Apple" button is hidden until it is connected to the backend.
- The notifications screen is a placeholder.

## Tech stack

- Expo SDK 54, React Native 0.81, React 19 (New Architecture and React Compiler enabled)
- Expo Router 6: file-based routing, typed routes, and API routes (`web.output: "server"`)
- TypeScript
- i18next, react-i18next and expo-localization
- expo-secure-store for tokens, AsyncStorage for preferences and the onboarding profile
- react-native-svg, react-native-reanimated, expo-linear-gradient, expo-image

## How the app talks to the backend

Screens never call Django directly. They send relative requests to `/api/auth/...`, which are handled by Expo Router API routes in `app/api/**/+api.ts`. Each route forwards the request to `${BACKEND_URL}/api/...`, passing through the `Authorization`, `Content-Type` and `If-None-Match` headers. If a network error occurs, the route retries up to 3 times.

```
Screen ── requestAuthJson() ──▶ /api/auth/* (Expo API route) ──▶ BACKEND_URL/api/* (Django)
          (lib/auth.ts: Bearer token, refresh, ETag cache)
```

| App API route | Backend endpoint |
| --- | --- |
| `POST /api/auth/signup` | `POST /api/auth/signup` |
| `POST /api/auth/verify-signup-code` | `POST /api/auth/verify-signup-code` |
| `POST /api/auth/send-signup-code` | `POST /api/auth/send-signup-code` |
| `POST /api/auth/resend` | `POST /api/auth/resend-signup-code` |
| `POST /api/auth/login` | `POST /api/auth/login` |
| `POST /api/auth/token/refresh` | `POST /api/auth/token/refresh` |
| `POST /api/auth/logout` | `POST /api/auth/logout` |
| `GET /api/auth/me` | `GET /api/auth/me` |
| `PATCH /api/auth/profile/edit` | `PATCH /api/users/me/` |
| `GET /api/auth/programs/` | `GET /api/programs/` |
| `GET /api/auth/programs/:id/exercises/` | `GET /api/programs/:id/exercises/` |
| `GET /api/auth/programs/:id/exercises/:exercise_id` | `GET /api/programs/:id/exercises/:exercise_id/` |
| `POST /api/auth/programs/:id/exercises/:exercise_id/steps/:step_index/complete` | `POST /api/programs/:id/exercises/:exercise_id/steps/:step_index/complete/` |

The API routes run inside the Expo dev server, so only the machine running `npm start` needs to reach the backend. The phone or simulator does not.

## Project structure

```
app/
  _layout.tsx        Providers and the navigation gate (onboarding / auth / tabs)
  onboarding.tsx     Intake flow
  (auth)/            welcome, login, signup, verify-email
  (tabs)/            dashboard (+ notifications), programs → [programId] →
                     exercises/[exerciseId] (detail, session, completed), profile (+ edit)
  api/auth/          Expo Router API routes that proxy to the Django backend
components/          Shared UI (buttons, cards, metric rings, text fields, ...)
providers/           Session (auth, tokens, profile), theme, local progress
lib/                 Auth fetch and refresh, backend URL config, storage, i18n, payload parsing
locales/             en.json, tr.json
data/                Local sample programs used by the dashboard
theme/, types/       Palette, layout helpers, shared types
```

## Getting started

### Prerequisites

- Node.js and npm
- A running [physio_track-backend](https://github.com/kaancakr/physio_track-backend) with exercise programs seeded (`python manage.py seed_programs`)
- Xcode or Android Studio if you want native builds with `npm run ios` / `npm run android`

### Install and run

```bash
npm install
# Create a .env file in the project root (see Environment variables below)
npm start           # Expo dev server
```

Other scripts from `package.json`:

```bash
npm run ios         # expo run:ios (native build)
npm run android     # expo run:android (native build)
npm run web         # expo start --web
npm run lint        # expo lint
npm run typecheck   # tsc --noEmit
```

### Environment variables

Expo CLI loads these from a `.env` file in the project root. That file is git-ignored.

| Name | Purpose |
| --- | --- |
| `BACKEND_URL` | Base URL of the Django backend. The API routes read it on the server side and need it to forward requests. |
| `EXPO_PUBLIC_BACKEND_URL` | The same base URL, read by the app's configuration check. If it is missing, the auth screens show a configuration notice and auth actions fail with a configuration error. |
| `EXPO_PUBLIC_AUTH_BYPASS` | Optional. Set to `true` to use a local demo profile without the backend, for UI testing. |
| `EXPO_PUBLIC_RETURNING_USER_WELCOME_REDIRECT` | Optional. Set to `true` to send signed-out returning users to the welcome screen. |

### Release builds

Native release builds send their relative `/api/...` requests to a hosted copy of the API routes. To set that up, deploy the server output and set the `origin` option of the `expo-router` plugin to its URL. `app.json` does not set this yet.

## Related

- Backend API: [kaancakr/physio_track-backend](https://github.com/kaancakr/physio_track-backend)
