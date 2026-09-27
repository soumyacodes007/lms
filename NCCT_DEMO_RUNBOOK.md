# NCCT SIH demo runbook

This runbook starts the English-only NCCT demo against one organization. The central server remains the source of truth; a centre PC can register as an offline sync device from the NCCT dashboard.

## 1. Prepare the database

From the repository root:

```powershell
corepack pnpm@10.19.0 install --frozen-lockfile
corepack pnpm@10.19.0 --filter @cio/db exec drizzle-kit migrate
```

Set `NCCT_ORGANIZATION_ID` to an existing organization ID in the local environment, then seed the demo records:

```powershell
corepack pnpm@10.19.0 --filter @cio/api seed:ncct
```

The seed is safe to run more than once. It creates two centres, three trainees, one published programme, one batch, one vacancy, and one pending nomination. Existing records with the same demo keys are reused.

## 2. Walk the training flow

1. Open the organization’s **NCCT** page.
2. Review the two centres and trainee profiles.
3. Open **Centre nominations** and approve the seeded nomination.
4. Confirm that the **Batch enrolment roster** gains the trainee.
5. Use **Ordered programme progress** to start and complete each available step. A step with an unfinished prerequisite stays locked.
6. Schedule a practical assessment, record a pass, and issue a credential.
7. Copy the verification link shown after issuance and open it in a new tab.
8. Use **Employment exchange** to apply for the seeded vacancy, then move the application through shortlist and selection.
9. Check **Operations report** and **NCCT workflow history** for the resulting counts and audit events.

## 3. Centre operations and offline sync

1. Use **Centre timetable and logistics** to schedule a session, register a hostel or room, and save trainee logistics.
2. Select **Register this PC** in the offline centre sync card.
3. Queue permitted centre events while the browser is offline. When connectivity returns, select **Sync now** and confirm the pending count falls to zero.

## Current scope

- English UI and content are enabled for the first SIH version.
- QR/NFC and face-recognition attendance remain deferred as agreed for the first demo.
- Existing course, lesson, exercise, certificate, and organization features remain available alongside NCCT.
