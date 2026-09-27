# NCCT LMS implementation plan

## Product target

Build a central NCCT training platform for VAMNICOM, RICMs, ICMs, and participating cooperative institutions. Keep the existing course, lesson, cohort, assessment, certificate, and analytics experience working while adding training operations and employment services in the same SvelteKit dashboard, Hono API, and PostgreSQL/Drizzle backend.

The first working version is English only. Digital attendance is deferred. One central server owns the authoritative database; training-centre PCs can continue selected work offline and synchronize when connectivity returns.

## Architecture rules

- Extend the existing organization, cohort, course, learner, exercise, certificate, and analytics modules instead of introducing a second LMS or a separate UI framework.
- Represent NCCT as the central organization and training institutions as scoped child records. Every institution-facing query and action must enforce institution access; central admins can aggregate across institutions.
- Add database tables and migrations in `packages/db`, pure queries under `packages/db/src/queries`, business rules in `apps/api/src/services`, validation in `packages/utils`, Hono routes in `apps/api/src/routes`, and dashboard pages/components in `apps/dashboard/src`.
- Use existing dashboard navigation, forms, tables, cards, typography, and responsive patterns for every new page.
- Keep an audit trail for approvals, evaluator decisions, certificate issuance, placement actions, and offline synchronization.
- Preserve existing LMS behaviour and run its relevant checks after each completed feature slice.

## Feature slices

Current delivery status: the end-to-end English SIH demo path is implemented and pushed in small feature commits. Centre membership permissions, role-scoped reads and writes, encrypted offline learning packs, and browser media caching are implemented. The remaining work is richer multilingual content and the deferred attendance hardware flow.

| Slice | Data and backend | User interface and acceptance target |
| --- | --- | --- |
| 1. Institution and trainee foundation | **Implemented:** institutions, trainee affiliations, profile fields, directory visibility, audit events, centre memberships, and tutor/student access scopes. | Central admins assign centre access; tutors see and write only assigned centres; students see their own trainee workspace. |
| 2. Programmes and nominations | **Implemented:** programmes, ordered steps, prerequisites, nominations, approval decisions, capacity checks, and enrolment. | The nomination-to-enrolment flow works in the dashboard. |
| 3. Scheduled batches | **Implemented:** programme batches, dates, capacity, instructors, enrolments, and progress dashboard. | Batch creation and ordered progress are available. |
| 4. Timetable and logistics | **Implemented:** sessions, centre resources, hostel/logistics records, collision checks, capacity-aware bookings, and booking visibility. | Conflicting schedules and exhausted resource capacity return visible errors; coordinators can review the timetable and resource rosters. |
| 5. Assessment and evaluator workflow | **Implemented:** practical assessments, evaluator decisions with scores and feedback, enrolment/date validation, credential gating, and audit events. | A passed assessment plus batch enrolment is required before issuance. |
| 6. Skills and credential registry | **Implemented:** trainee skills, public verification token/page, revocation, and directory visibility controls. | Employers can search visible certified trainees. |
| 7. Employment exchange | **Implemented:** vacancies, applications, shortlist/select/reject actions, and application status history. Separate employer accounts can follow. | The dashboard shows the employment pipeline and recent transitions. |
| 8. Career counselling | **Implemented for the demo:** profile-aware job matching, conversation history, and explainable suggestions. | Guidance is tied to the trainee’s skills and open jobs. |
| 9. Offline centre PC | **Implemented for learning content:** device identity, centre-scoped idempotent nomination/progress queue, conflict policy, encrypted programme packs, visible sync status, and browser media caching are implemented. Cached packs include lesson text, translation content, exercise prompts, question metadata, and cacheable media URLs. | Centres can queue permitted actions and review cached programme learning content without connectivity. |
| 10. NCCT analytics | **Implemented for the demo:** central summary metrics, institution activity, region/status breakdowns, placement metrics, audit history, and CSV export. | Central operators can compare centres and export the current NCCT operating picture. |

## Delivery order

1. **Baseline and mapping:** establish the repository baseline, install pinned dependencies, run the baseline build, and record existing behaviour. Retain the existing license and notices.
2. **NCCT foundation:** institution/trainee data model, scoped roles, profile pages, and seed data for a small multi-centre demo.
3. **End-to-end training flow:** ordered programme, nomination and approval, scheduled batch, assessment, certificate, and progress dashboard. This is the first SIH demonstration milestone.
4. **Operations:** timetable, room/hostel/logistics allocations, evaluator scheduling, certificate verification, and certified trainee directory.
5. **Employment:** employer portal, job board, applications, placement tracking, and career guidance.
6. **Offline and reporting:** centre PC text-pack cache/queue/sync, central dashboards, exports, and recovery testing for interrupted sync.
7. **Later scope:** Indian-language UI/content and QR/NFC or face-based attendance after the English-only core is stable.

## First demonstration path

An NCCT administrator creates a programme and batch; a centre nominates a trainee; an approver confirms the nomination; the trainee completes the ordered courses and a practical evaluation; a certificate is issued and publicly verified; an employer finds the certified trainee and receives a job application. The central dashboard shows the resulting programme, batch, certification, and placement counts. The centre PC can queue a permitted action while offline and show its successful sync afterward.

## Verification gates

- Baseline dashboard/API builds complete with the supported Node and pnpm versions and required services.
- Each feature slice has migration checks, permission tests, API tests for its business rules, and a manual dashboard walkthrough using central admin, coordinator, trainee, evaluator, and employer accounts as relevant.
- Nomination capacity and approval changes are transaction safe; institution isolation is tested; public verification reveals only approved credential data.
- Offline actions are idempotent and produce visible success/conflict states after reconnecting.
- Existing course, lesson, cohort, assessment, and certificate flows remain usable at the final demo.
