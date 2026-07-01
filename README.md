# Facet

Facet is a voice-first AI interview experience that helps users practice technical interviews in real time. Users enter a GitHub profile, begin a live interview session, and receive AI-generated feedback and a score at the end.

## What it does

- Collects a GitHub profile URL from the user
- Starts a live interview flow with microphone access
- Records user speech and stores conversation messages
- Generates interview feedback and a score using Gemini
- Shows the final transcript and evaluation on a results page

## Tech stack

- Frontend: React, TypeScript, Tailwind, shadcn-style UI
- Backend: Express, TypeScript, Prisma, PostgreSQL
- AI: Gemini for result evaluation
- Real-time: OpenAI and WebRTC-style interview flow with microphone input 

## Project structure

```text
apps/
  frontend/   # React app for the interview experience
  backend/    # Express API and Prisma models
packages/     # Shared UI/config packages
```

## Prerequisites

- Node.js 18+
- Bun 1.3+
- PostgreSQL database

## Installation

From the repository root:

```bash
bun install
```

## Environment variables

### Backend

In [apps/backend](apps/backend), set:

```bash
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend

In [apps/frontend](apps/frontend), set:

```bash
VITE_BACKEND_URL=http://localhost:3001
```

## Database setup

Run Prisma migrations:

```bash
cd apps/backend
bunx prisma migrate dev
```

Generate the Prisma client:

```bash
bunx prisma generate
```

## Running locally

Start the backend:

```bash
cd apps/backend
bun run dev
```

Start the frontend:

```bash
cd apps/frontend
bun run dev
```

Then open the frontend in your browser.

## API overview

### Pre-interview

- POST /api/v1/pre-interview
- Creates a new interview record from a GitHub profile URL

### Session

- POST /api/v1/session/:interviewId
- Starts the interview session flow

### Messages

- POST /api/v1/session/user/response/:interviewId
- Saves a user transcript message

### Result

- GET /api/v1/result/:interviewId
- Returns score, feedback, and transcript

## Deployment notes

The current app is structured for a split deployment:

- Frontend: deploy on Vercel
- Backend: deploy on a server host such as Railway, Render, or Fly.io
- Database: use PostgreSQL-compatible hosting such as Neon or Supabase

## Notes

This project is still evolving, and some parts of the realtime interview flow may depend on external credentials and services. The core experience is designed to be simple, fast, and easy to extend.
