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

| Slice | Data and backend | User interface and acceptance target |
| --- | --- | --- |
| 1. Institution and trainee foundation | Institutions, centre membership, trainee cooperative affiliation, district/state, profile fields, role permissions | Central admin manages institutions; centre coordinator sees only their centre; trainee sees a complete training history. |
| 2. Programmes and nominations | Programme, ordered course steps, prerequisites, applications, nominations, approval decisions, seat allocation | Coordinator publishes a programme; institution nominates a trainee; approver accepts/rejects; approved trainee is enrolled; next course unlocks after prerequisite completion. |
| 3. Scheduled batches | Extend cohorts with programme, centre, dates, capacity, instructor assignments, enrolment status | Batch creation, calendar, roster, seat count, waitlist, and progress dashboard work for a centre. |
| 4. Timetable and logistics | Sessions, rooms, hostel beds, meal/transport needs, resource reservations, collision checks | Coordinators assign sessions and resources; conflicts and capacity problems are visible before saving. |
| 5. Assessment and evaluator workflow | Practical assessment events, evaluator assignment, rubric/results, interview slot, decision record | Evaluators see assigned assessments, enter outcomes, and coordinators can review pending certification decisions. |
| 6. Skills and credential registry | Skill taxonomy, trainee skills, certificate links, verification token/public record, revocation status | A certificate has a verifiable public page/QR URL; authorised employers can search certified trainees with trainee-controlled visibility. |
| 7. Employment exchange | Employer accounts, vacancies, skill requirements, applications, status history, placement outcome | Employer posts a job; eligible trainee applies; employer reviews; centre sees placement outcomes. |
| 8. Career counselling | Profile-aware guidance service, course/job suggestions, conversation history and guardrails | Trainee receives explainable suggestions tied to their skills, certificates, and open jobs; unsupported claims are avoided. |
| 9. Offline centre PC | Local encrypted queue/cache, device identity, idempotent sync API, conflict policy, sync status | A centre can view cached programmes and capture permitted nomination/progress actions without internet; reconnecting syncs once and reports conflicts. |
| 10. NCCT analytics | Institution/batch/programme reporting queries and exports | Central dashboard shows nominations, approvals, enrolment, progress, completion, certification, and placements by centre/district/state. |

## Delivery order

1. **Baseline and mapping:** import the complete upstream application into a fresh repository history, install pinned dependencies, run the baseline build, and record existing behaviour. Retain the existing license and notices.
2. **NCCT foundation:** institution/trainee data model, scoped roles, profile pages, and seed data for a small multi-centre demo.
3. **End-to-end training flow:** ordered programme, nomination and approval, scheduled batch, assessment, certificate, and progress dashboard. This is the first SIH demonstration milestone.
4. **Operations:** timetable, room/hostel/logistics allocations, evaluator scheduling, certificate verification, and certified trainee directory.
5. **Employment:** employer portal, job board, applications, placement tracking, and career guidance.
6. **Offline and reporting:** centre PC cache/queue/sync, central dashboards, exports, and recovery testing for interrupted sync.
7. **Later scope:** Indian-language UI/content and QR/NFC or face-based attendance after the English-only core is stable.

## First demonstration path

An NCCT administrator creates a programme and batch; a centre nominates a trainee; an approver confirms the nomination; the trainee completes the ordered courses and a practical evaluation; a certificate is issued and publicly verified; an employer finds the certified trainee and receives a job application. The central dashboard shows the resulting programme, batch, certification, and placement counts. The centre PC can queue a permitted action while offline and show its successful sync afterward.

## Verification gates

- Baseline dashboard/API builds complete with the supported Node and pnpm versions and required services.
- Each feature slice has migration checks, permission tests, API tests for its business rules, and a manual dashboard walkthrough using central admin, coordinator, trainee, evaluator, and employer accounts as relevant.
- Nomination capacity and approval changes are transaction safe; institution isolation is tested; public verification reveals only approved credential data.
- Offline actions are idempotent and produce visible success/conflict states after reconnecting.
- Existing course, lesson, cohort, assessment, and certificate flows remain usable at the final demo.
