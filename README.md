# JobTracker AI

A cross-platform mobile application for tracking job applications, powered by AI to provide personalized interview chance predictions, skill-gap analysis, and stage-specific career coaching.

Built with React Native, Expo, Supabase, and Groq AI (LLaMA 3.3 70B).

## Screenshots

> _Add screenshots here — Dashboard, Jobs list, Job Detail with AI analysis, Profile screen_

## Features

### Authentication
- Email/password signup and login via Supabase Auth
- Forgot password flow with email reset
- Secure session storage using Expo SecureStore

### Job Application Tracking
- Add, edit, and delete job applications
- Track status: Applied, Interview, Offer, Rejected
- Store company, role, location, salary, notes, and original job description
- Filter applications by status
- Expandable job description view on the detail screen

### AI-Powered Career Coaching (Groq / LLaMA 3.3 70B)
- **Job match analysis** — paste any job description to get a match score, strengths, skill gaps, and improvement areas based on your actual profile
- **Interview chance estimation** — when adding a job, get an instant probability estimate and quick tips
- **Status-based coaching** — AI guidance changes automatically based on application stage:
  - **Applied** — interview chance, strengths, focus areas
  - **Interview** — topics to revise, likely questions, online/in-person specific tips
  - **Offer** — salary negotiation tips, questions to ask, things to review before signing
  - **Rejected** — constructive feedback and next steps, framed supportively
- AI prompts are personalized using the user's actual skills and work experience stored in their profile, not generic advice

### Profile
- Editable profile with name, role, location, GitHub, LinkedIn, and portfolio links
- Skills picker with a searchable database of 200+ IT/tech skills across categories (languages, frameworks, cloud, DevOps, databases, testing, AI/ML, security, and more), plus support for adding custom skills
- Work experience tracker with automatic duration formatting (months to years) and a "currently working here" toggle

### Other
- Dashboard with live stats (applied / interview / offer / rejected counts) pulled from the database
- Light and dark theme support, following system preference
- Custom app icon and branding

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile framework | Expo (SDK 54), React Native |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State management | Zustand |
| Backend / Database | Supabase (PostgreSQL, Row Level Security, Auth) |
| AI | Groq API (LLaMA 3.3 70B) |
| API security | Vercel serverless function acting as a proxy, so the Groq API key is never bundled into the mobile app |
| Styling | Inline styles with a centralized theme/colors system |

## Architecture

```
JobTracker/
├── app/
│   ├── (auth)/              # Login, signup, forgot password
│   ├── (tabs)/
│   │   ├── index.tsx        # Dashboard
│   │   ├── jobs.tsx         # Job list with filters
│   │   ├── analyze.tsx      # Standalone AI job analyzer
│   │   └── profile.tsx      # Profile, skills, work experience
│   ├── job/[id].tsx         # Job detail with status-based AI coaching
│   └── add-job.tsx          # Add job with AI chance analysis
├── stores/
│   ├── jobStore.ts          # Job state (Zustand + Supabase)
│   └── experienceStore.ts   # Work experience state
├── lib/
│   ├── supabase.ts          # Supabase client setup
│   ├── useAuth.ts           # Auth session hook
│   └── useTheme.ts          # Light/dark theme hook
└── constants/
    └── Colors.ts            # App color tokens
```

A separate small backend (`jobtracker-api`) is deployed on Vercel as a serverless function. Its only job is to receive a prompt from the app and forward it to Groq using a server-side environment variable, so the AI API key never ships inside the mobile app bundle.

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

## Getting Started

### Prerequisites
- Node.js 20+
- Expo Go app (iOS or Android) for testing on a physical device
- A free Supabase project
- A free Groq API key
- A Vercel account (for the AI proxy function)

### Setup

```bash
# Clone the repo
git clone https://github.com/Dakshinab/JobTracker-with-AI.git
cd JobTracker-with-AI

# Install dependencies
npm install --legacy-peer-deps

# Create your environment file
cp .env.example .env
```

Fill in `.env` with your own values:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the SQL in the schema section above inside your Supabase SQL Editor to create the tables and RLS policies.

Deploy the `jobtracker-api` proxy separately to Vercel, add `GROQ_API_KEY` as an environment variable in the Vercel project settings, and update the endpoint URL used in `analyze.tsx`, `add-job.tsx`, and `job/[id].tsx` to point to your own deployment.

Start the app:

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Why this project

This started as a way to combine full-stack mobile development with practical AI integration, beyond a simple CRUD app. The goal was to build something a job seeker would actually use during their own search — which is also exactly how it was tested, on a real, ongoing job search.

## Roadmap

- [ ] Cache AI analysis results so re-opening a job doesn't always re-call the AI
- [ ] Date picker for interview scheduling instead of manual text entry
- [ ] Pull-to-refresh on the jobs list
- [ ] Offline support with local caching

## Author

**Dakshina Bhanu**
GitHub: [@Dakshinab](https://github.com/Dakshinab)