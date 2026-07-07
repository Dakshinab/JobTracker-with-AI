# JobTracker AI

A cross-platform mobile application for tracking job applications, powered by AI to provide personalized interview chance predictions, skill-gap analysis, and stage-specific career coaching.

Built with React Native, Expo, Supabase, and Groq AI (LLaMA 3.3 70B).

---

## Screenshots

> _Add screenshots here — Splash screen, Onboarding, Dashboard, Jobs list, Job Detail with AI analysis, Profile screen_

---

## Features

### Onboarding & Authentication
- Animated splash screen with app icon and progress bar
- 3-slide onboarding flow shown only on first launch (swipeable, with gradient background)
- Email/password signup and login via Supabase Auth
- Forgot password flow with email reset
- Secure session storage using Expo SecureStore
- Persistent login — returns directly to dashboard on relaunch

### Job Application Tracking
- Add, edit, and delete job applications
- Track status: Applied, Interview, Offer, Rejected
- Store company, role, location, salary, notes, and original job description
- Filter applications by status
- Tappable dashboard stats — tap any stat card to jump to filtered job list
- Expandable job description view on the detail screen

### AI-Powered Career Coaching (Groq / LLaMA 3.3 70B)
- **Job match analysis** — paste any job description to get a match score, strengths, skill gaps, and improvement areas based on your actual profile
- **Interview chance estimation** — when adding a job, get an instant probability estimate and quick tips
- **Status-based coaching** — AI guidance changes automatically based on application stage:
  - **Applied** — interview chance score, strengths, focus areas
  - **Interview** — topics to revise, likely questions, online/in-person specific tips, days remaining countdown
  - **Offer** — salary negotiation tips, questions to ask, things to review before signing
  - **Rejected** — constructive feedback, next steps, motivational note
- AI analysis is cached to Supabase after first generation — reopening a job reuses the saved result instead of calling the AI again
- AI prompts are personalized using the user's actual skills and work experience, not generic advice

### Profile
- Editable profile with name, role, location, GitHub, LinkedIn, and portfolio links
- Skills picker with a searchable database of 200+ IT/tech skills across 19 categories (languages, frameworks, DevOps, cloud, databases, testing, AI/ML, security, monitoring, and more), plus support for adding custom skills
- Work experience tracker with automatic duration formatting (months to years) and a currently working here toggle

### Other
- Dashboard with live stats pulled from the database
- Light and dark theme support, following system preference
- Custom app icon and branding throughout
- Secure AI proxy — Groq API key never ships inside the mobile app bundle

---

## Try it yourself

Install **Expo Go** on your phone (iOS App Store or Google Play Store), then clone the repo, set up your environment variables, and run:

```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go. No need to be on the same WiFi network when using tunnel mode.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | Expo (SDK 54), React Native |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State management | Zustand |
| Backend / Database | Supabase (PostgreSQL, Row Level Security, Auth) |
| AI | Groq API (LLaMA 3.3 70B) |
| API security | Vercel serverless proxy — Groq key stays server-side only |
| Animations | React Native Animated API |
| Gradient | expo-linear-gradient |
| Styling | Inline styles with a centralized theme/colors system |

---

## Architecture

```
JobTracker/
├── app/
│   ├── splash.tsx           # Animated splash screen
│   ├── onboarding.tsx       # 3-slide onboarding (first launch only)
│   ├── index.tsx            # Entry point redirect
│   ├── (auth)/              # Login, signup, forgot password
│   ├── (tabs)/
│   │   ├── index.tsx        # Dashboard with live stats
│   │   ├── jobs.tsx         # Job list with status filters
│   │   ├── analyze.tsx      # Standalone AI job analyzer
│   │   └── profile.tsx      # Profile, skills, work experience
│   ├── job/[id].tsx         # Job detail with status-based AI coaching
│   └── add-job.tsx          # Add job with AI chance analysis
├── stores/
│   ├── jobStore.ts          # Job state (Zustand + Supabase)
│   └── experienceStore.ts   # Work experience state
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── useAuth.ts           # Auth session hook
│   └── useTheme.ts          # Light/dark theme hook
└── constants/
    └── Colors.ts            # Design system color tokens
```

A separate backend (`jobtracker-api`) is deployed on Vercel as a serverless function. It receives a prompt from the app and forwards it to Groq using a server-side environment variable, so the AI API key never ships inside the mobile app bundle.

---

## Database Schema (Supabase)

```sql
profiles (
  id, name, role, location, github, linkedin, portfolio,
  skills text[], email
)

jobs (
  id, user_id, company, role, location, salary, status,
  notes, date, job_description, interview_date,
  interview_type, ai_analysis jsonb
)

experiences (
  id, user_id, company, role, months, currently_working
)
```

Row Level Security is enabled on all tables so each user can only read and write their own data.

---

## CI/CD

GitHub Actions runs on every push to `main`:
- TypeScript type checking
- Secret scanning — fails the build if a Groq or Supabase key is detected in source code

---

## Getting Started

### Prerequisites
- Node.js 20+
- Expo Go app on your phone
- A free Supabase project
- A free Groq API key
- A Vercel account for the AI proxy

### Setup

```bash
git clone https://github.com/Dakshinab/JobTracker-with-AI.git
cd JobTracker-with-AI
npm install --legacy-peer-deps
cp .env.example .env
```

Fill in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the SQL schema in your Supabase SQL Editor to create the tables and RLS policies.

Deploy `jobtracker-api` to Vercel, add `GROQ_API_KEY` as an environment variable, and update the proxy endpoint URL in `analyze.tsx`, `add-job.tsx`, and `job/[id].tsx`.

```bash
npx expo start
```

---

## Why this project

Built as a portfolio project combining full-stack mobile development with practical AI integration — something beyond a standard CRUD app. The goal was to build a tool a real job seeker would actually use, which is also exactly how it was tested during an active job search.

---

## Roadmap

- [ ] Date picker for interview scheduling
- [ ] Pull-to-refresh on the jobs list
- [ ] Offline support with local caching
- [ ] Monthly AI career progress reports

---

## Author

**Dakshina Bhanu**
GitHub: [@Dakshinab](https://github.com/Dakshinab)
LinkedIn: [linkedin.com/in/dakshina-dissanayake](https://linkedin.com/in/dakshina-dissanayake)
Portfolio: [dakshina-bytes.online](https://dakshina-bytes.online)