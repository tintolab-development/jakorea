# 로그 관리 — BE 갭 / 요청 문서 인덱스

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **앱** | Homepage Admin |

## Homepage 로그 API — FE 연동 현황

| 화면 | API | FE |
|------|-----|-----|
| 개인정보 조회 | `GET …/privacy-access` (+ export) | remote 완료 |
| 파일 다운로드 | `GET …/file-downloads` (+ export) | remote 완료 |
| 회원 로그인 | `GET …/member-logins` (+ export) | **remote 완료** (2026-08-13) |
| 관리자 계정 처리 | `GET …/admin-account-actions` (+ export) | **remote 완료** |
| 버그/이슈 | `GET …/system-issues` (+ export) | **remote 완료** |

시드:

- privacy / file-download → [`logs-dummy-seed-backend-request.md`](./logs-dummy-seed-backend-request.md) · `seed_logs_local.sql`
- member / account / issues → `JAHOMEADMINBACK/scripts/seed_logs_admin_screens_local.sql`

요청 이력(구현 전): [`logs-homepage-admin-api-backend-request.md`](./logs-homepage-admin-api-backend-request.md)

## 아직 mock only

| 화면 | 사유 |
|------|------|
| 교육 · 프로그램 소개 (`/education/programs`) | write API 없음 — [`education-program-intro-backend-gap.md`](./education-program-intro-backend-gap.md) |

**Last updated:** 2026-08-13
