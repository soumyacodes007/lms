# NCCT requirement matrix

This matrix ties the SIH requirements to the current demonstration surface.

| Requirement | Dashboard surface | API/data surface | Status |
| --- | --- | --- | --- |
| Programme registration and nominations | Centre nominations | `/ncct/nominations`, `ncct_nomination`, `ncct_enrollment` | Implemented |
| Trainee and institution profiles | NCCT setup | `/ncct/institutions`, `/ncct/trainees`, institution members | Implemented |
| Ordered learning programmes | Programmes and batches; ordered progress | Programme steps, prerequisites, progress records | Implemented |
| Scheduled training batches | Programmes and batches | Batch lifecycle, seats, dates, instructors | Implemented |
| Timetables and logistics | Centre timetable and logistics | Sessions, resources, bookings, trainee logistics | Implemented |
| Evaluator workflow | Evaluator workflow | Assessment scheduling, scores, feedback, audit events | Implemented |
| Certificates and verification | Credential issuance; public verification page | Credential registry, revocation, verification token | Implemented |
| Certified trainee directory | Directory filters | Institution, state, skill, and text filters | Implemented |
| Employment exchange | Recruiter dashboard; vacancies and applications | Jobs, applications, status history | Implemented |
| Career counselling | Career counselling assistant | Profile-aware matching and conversation records | Implemented |
| Offline centre PCs | Offline learning packs and sync card | Encrypted packs, media cache, idempotent sync events | Implemented for learning content |
| Analytics and reporting | Operations report and CSV export | Cross-centre aggregates and audit history | Implemented |
| QR/NFC or face attendance | Deferred | Hardware attendance event model not enabled | Deferred by scope |
| Additional Indian-language UI/content | Deferred | English content is the first delivery language | Deferred by scope |

The central server remains authoritative. Centre PCs can retain selected learning content and queue permitted actions until connectivity returns.
