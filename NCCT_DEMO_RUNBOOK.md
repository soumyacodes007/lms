# NCCT SIH demo runbook

This runbook starts the English-only NCCT demo against one organization. The central server remains the source of truth; a centre PC can register as an offline sync device from the NCCT dashboard.

## 1. Prepare the database

From the repository root:

```powershell
corepack pnpm@10.19.0 install --frozen-lockfile
corepack pnpm@10.19.0 --filter @cio/db exec drizzle-kit migrate
```

Set `NCCT_ORGANIZATION_ID` to an existing organization ID in the local environment, then seed the demo records. To exercise centre-scoped roles, also set `NCCT_TUTOR_PROFILE_ID` and `NCCT_STUDENT_PROFILE_ID` to profiles that belong to that organization:

```powershell
$env:NCCT_ORGANIZATION_ID = 'your-organization-id'
$env:NCCT_TUTOR_PROFILE_ID = 'your-tutor-profile-id'
$env:NCCT_STUDENT_PROFILE_ID = 'your-student-profile-id'
corepack pnpm@10.19.0 --filter @cio/api seed:ncct
```

The seed is safe to run more than once. It creates two centres, three trainees, a published programme with two ordered courses, an approved nomination and completed enrolment, a passed practical assessment, a verifiable credential, a vacancy with a shortlisted application, a timetable session, room and hostel resources, a resource booking, and a trainee logistics record. When profile IDs are supplied, the first trainee is linked to the student profile and the tutor receives coordinator access to the first centre. Existing records with the same demo keys are reused.

## 2. Walk the training flow

1. Open the organization’s **NCCT** page.
2. Review the two centres and trainee profiles.
3. Open **Centre nominations** to review the seeded approval and its decision note. Create another nomination if you want to demonstrate the pending, waitlist, and rejection states.
4. Confirm that the **Batch enrolment roster** contains the seeded trainee and that both ordered programme steps are complete.
5. Open **Practical assessments** to review the passed evaluator result and feedback. The credential is already issued for this completed path.
6. Copy the verification link shown in **Credentials** and open it in a new tab.
7. Use **Employment exchange** to review the seeded shortlisted application and move it through selection. Active applications can be withdrawn by the trainee; closed vacancies and duplicate applications are rejected.
8. Review **Recruiter dashboard** for vacancy-level application counts, then check **Operations report** and **NCCT workflow history** for the resulting totals and audit events.

## 3. Centre operations and offline sync

1. Use **Centre timetable and logistics** to schedule a session, register a hostel or room, save trainee logistics, and book a resource. The timetable, resource inventory, bookings, and logistics roster remain visible on the page.
2. Select **Cache offline** beside an ordered programme. Confirm its lessons and assessment prompts appear in **Offline learning packs**, then use **Cache media** to download supported media assets. The pack shows the cached-versus-total media count for this PC.
3. Select **Register this PC** in the offline centre sync card.
4. Queue nominations and programme progress while the browser is offline. When connectivity returns, select **Sync now** and confirm the pending count falls to zero. Events from deactivated devices, other centres, or unsupported event types remain conflicts for review.
5. Confirm the sync card records the latest synchronization time for this centre PC.

## Current scope

- English UI and content are enabled for the first SIH version.
- Offline packs include lesson text, translation content, exercise prompts, and question metadata. Media assets are cached when their source permits download; failed assets still need a connection.
- Operations report includes institution activity totals and the CSV export includes those centre rows.
- QR/NFC and face-recognition attendance remain deferred as agreed for the first demo.
- Existing course, lesson, exercise, certificate, and organization features remain available alongside NCCT.
