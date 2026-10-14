# CMS 프로그램 상세 API↔노출 parity 인벤토리

자동 갱신: `pnpm --filter cms parity:inventory`  
SSOT screenId: [`inventory-screens.ts`](../src/features/program/shared/parity/inventory-screens.ts)

## 판정 기준

- **apiTruth**: GET → adapter `Program` (+ persisted `registrationOverlay`만, `preferOverlay: false`)
- **uiExposedStrict**: 공식 Read 체인, operational store reset 후
- **Gate**: remote 화면에서 strict diff = 0

## Screen catalog (13)

| screenId | variant | priority | remote | route |
| --- | --- | --- | --- | --- |
| `general.info.common` | general | P0 | remote | /programs/general?lnb=info&tab=info |
| `general.info.recruitment.participant` | general | P0 | remote | /programs/general?lnb=info&tab=recruitment (participant) |
| `general.info.recruitment.instructor` | general | P0 | remote | /programs/general?lnb=info&tab=recruitment (instructor) |
| `general.info.recruitment.volunteer` | general | P0 | remote | /programs/general?lnb=info&tab=recruitment (volunteer) |
| `general.info.application` | general | P0 | remote | /programs/general?lnb=info&tab=application |
| `general.progress.school` | general | P1 | remote | lnb=progress&tab=progress_participants&schoolId&schoolTab |
| `general.progress.instructor` | general | P1 | remote | progress_instructors&instructorId&instructorTab |
| `general.progress.volunteer` | general | P1 | remote | progress_volunteers&volunteerId&volunteerTab |
| `general.progress.participant` | general | P1 | remote | progress_participants&participantId |
| `company_school.info.common` | company_school | P0 | remote | /programs/company_school?programId (program-detail-fullpage-modal) |
| `trained_teachers.info.common` | trained_teachers | P2 | remote | /programs/trained-teachers?programId |
| `ujat.info.common` | ujat | P0 | remote | /programs/ujat?lnb=info |
| `registration.general.seed_to_detail` | registration_general | P0 | mixed | registration-fullpage-modal → detail-fullpage-modal |

## Static bypass scan (detail-modal / registration)

| pattern | hit count |
| --- | --- |
| `getGeneralRecruitOverlayRecord` | 0 |
| `preferOverlay_true` | 0 |
| `registrationOverlay_bracket` | 0 |
| `readOverlayForSave` | 0 |

상세 파일 목록: [`program-detail-api-parity-inventory.json`](./program-detail-api-parity-inventory.json)

**Last generated:** 2026-10-14T10:04:10.724Z
