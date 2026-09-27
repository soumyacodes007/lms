# NCCT LMS

NCCT LMS is a web platform for cooperative training centres and rural youth. It combines learning delivery with programme nominations, training batches, assessments, credentials, employment exchange, career guidance, centre logistics, offline centre synchronisation, and NCCT reporting.

This repository is the SIH demonstration build for a central NCCT server with centre PCs that can queue selected work while disconnected.

## Demonstration workflow

1. Create an institution and trainee profile.
2. Publish an ordered learning programme and schedule a batch.
3. Submit and approve a trainee nomination.
4. Track ordered course progress and schedule a practical assessment.
5. Record a pass, issue a verifiable credential, and open the public verification page.
6. Publish a vacancy, submit an application, and review placement status history.
7. Export the NCCT operations report as CSV.
8. Cache an ordered programme for offline lesson text and assessment prompts.
9. Disconnect a centre PC, queue a nomination or progress update, then reconnect and review synchronisation results.

## Stack

- SvelteKit dashboard with the existing product design system
- Hono API
- PostgreSQL with Drizzle migrations
- Better Auth
- Redis and MinIO for the supporting services

## Local setup

Requirements: Node.js 20.19.3+, pnpm 10, and Docker.

```bash
pnpm install
Copy-Item .env.example .env
pnpm exec docker compose up -d postgres redis minio
pnpm --filter @cio/db db:migrate
pnpm --filter @cio/api seed:ncct
pnpm dashboard:dev
pnpm api:dev
```

The API runs on port 3002 and the dashboard on port 5173 in local development. The exact seed and walkthrough are documented in [NCCT_DEMO_RUNBOOK.md](NCCT_DEMO_RUNBOOK.md).

## Feature status

The implementation plan is in [NCCT_IMPLEMENTATION_PLAN.md](NCCT_IMPLEMENTATION_PLAN.md). The English SIH demonstration path is implemented. Centre membership permissions, encrypted offline learning packs, and browser media caching are included. Multilingual content and QR/NFC or face attendance remain explicitly tracked follow-up work; attendance was deferred for the first version.

## Repository

The project is maintained at [github.com/soumyacodes007/lms](https://github.com/soumyacodes007/lms).
