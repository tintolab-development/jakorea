# 대시보드 API 연동 명세

관리자 홈(`/`) 위젯과 Swagger 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,dashboard` | `isRealApiModuleEnabled('dashboard')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

---

## Endpoint ↔ UI

| Swagger endpoint | 프론트 query key | 서비스 | UI |
|------------------|------------------|--------|-----|
| `GET /home` | `get_admin_dashboard_home` | `getDashboardHomeSummary()` | 툴바 `programCount`, `memberCount` |
| `GET /notifications/count` | `get_admin_dashboard_notifications_count` | `getDashboardNotificationCount()` | 헤더 알림 badge (ADMIN) |
| `GET /notifications` | `get_admin_notifications` | `getAdminNotifications()` | 헤더·알림 위젯 목록 (ADMIN remote) |
| `PATCH /notifications/{recipientId}/read` | `patch_admin_notifications_recipientId_read` | `markAdminNotificationAsRead()` | 알림 읽음 |
| `PATCH /notifications/read-all` | `patch_admin_notifications_read-all` | `markAllAdminNotificationsAsRead()` | 전체 읽음 |
| `PATCH /notifications/{recipientId}/hidden` | `patch_admin_notifications_recipientId_hidden` | `hideAdminNotification()` | 알림 숨김 |
| `GET /recruitments` | `get_admin_dashboard_recruitments` | `getRecruitmentStatusList()` | 모집 현황 위젯 |
| `GET /recruitments` (options) | `get_admin_dashboard_program_options` | `getDashboardProgramOptions()` | 설정 모달·일정 위젯 프로그램 메타 |
| `GET /kpi-progress` | `get_admin_dashboard_kpi-progress` | `getKpiAchievementList()` | KPI 위젯 (목표+실적, 해당없음은 `applicable`) |
| `GET /program-inquiries` | `get_admin_dashboard_program-inquiries` | `getProgramInquiryStatusList()` | 문의 현황 위젯 |
| `GET /program-schedules` | `get_admin_dashboard_program-schedules` | `getDashboardScheduleEvents()` | 프로그램 일정 위젯 (remote 시 API-only) |
| `GET/PUT /api/me/dashboard-preferences` | `get_me_dashboard_preferences` | `dashboard-preferences-service` | 설정·DnD layout SSOT (revision 잠금) |
| `GET /shortcuts` | `get_admin_dashboard_shortcuts` | `getDashboardShortcuts()` | 바로가기 메타 |
| `GET /api/me/dashboard-shortcut-badges` | `get_me_dashboard_shortcut_badges` | `getDashboardShortcutBadges()` | 바로가기 배지 count |
| `POST /api/me/dashboard-shortcut-badges/{id}/read` | — | `readDashboardShortcutBadge()` | 바로가기 배지 읽음 |
| `GET /log-alerts` | `get_admin_dashboard_log-alerts` | `getDashboardLogAlerts()` | MASTER 로그 알림 위젯 |

**preferences_only:** `shortcuts/visibility`, `widgets/layout`, `program-filters` granular API는 호출하지 않음. Me preferences API로 통합.

**로컬 더미 시드 (설정 mock 정합):** [dashboard-settings-dummy-seed-backend-request.md](./dashboard-settings-dummy-seed-backend-request.md) · [`dashboard-settings-seed.payload.json`](./dashboard-settings-seed.payload.json)

**레거시:** `GET/PUT /api/admin/dashboard/preferences` — Orval 생성만 유지, 프론트는 Me API 사용.

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/dashboard/` |
| HTTP 래퍼 | `features/dashboard/api/dashboard-api-client.ts` |
| mock/실 분기 | `features/dashboard/api/admin-dashboard-service.ts` |
| DTO adapter | `features/dashboard/api/adapters/` |
| Me preferences adapter | `features/dashboard/api/adapters/dashboard-me-preferences-adapters.ts` |
| 알림 adapter | `features/dashboard/api/adapters/notification-adapters.ts` |
| Query keys | `features/dashboard/api/dashboard-query-keys.ts` |

OpenAPI subset 필터: `scripts/filter-openapi-dashboard.mjs` — `/api/admin/dashboard*`, `/api/me/dashboard*`, `/api/admin/notifications*`

---

## TanStack Query 캐시

- Key: `['cms', 'dashboard', 'remote' | 'mock', …]` — `useDashboardQueryScope()`
- 실 API 전용 훅: `useDashboardRemoteQueryEnabled()`
- `logout` / `completeAdminAuth` → `clearDashboardQueryCache()`
- 상세 규칙: [tanstack-query-cache.mdc](../../.cursor/rules/libraries/tanstack-query-cache.mdc)

## 에러 처리

- remote 모드에서 API 실패 시 **mock으로 조용히 fallback하지 않음**
- 위젯은 React Query `isError` → `DashboardWidgetQueryError`
- Query `retry: false` (403/500 즉시 표면화)
- Me preferences 저장 409 → revision 충돌, 재조회 후 재시도 필요

---

## KPI adapter

API 스키마는 `actualParticipantCount` 등 실적 필드를 제공합니다. 미제공이면 UI는 `-`.
`participantApplicable` / `schoolApplicable` / `classApplicable`이 오면 그 값을 우선합니다.
플래그가 없으면 `programType=individual` → 학교·학급 비활성, `trained_teachers` 또는 제목에 「교육받은 교사」→ 전 항목 비활성.

## 모집 adapter

`DashboardRecruitmentResponse` 기본 필드는 status·기간뿐입니다. FE는 아래 **확장 필드가 오면** 참여자/봉사자 `n/n`에 매핑합니다.

- 참여자: `participantAppliedCount` | `studentAppliedCount` | `approvedStudentCount` / `participantCapacity` | `studentCapacity`
- 봉사자: `volunteerAppliedCount` | `instructorAppliedCount` / `volunteerCapacity` | `instructorCapacity`

`recruitmentStatus`가 있으면 그대로 사용(기간 자동 산출은 **BE 책임**). 없을 때만 `recruitmentStartAt`~`EndAt`으로 추정합니다.

OpenAPI에 `participantAppliedCount` / `volunteerAppliedCount` 등과 KPI `*Applicable` 플래그가 명시되어 있습니다.

## 문의 adapter

`summaries`가 있으면 그 집계를 그대로 씁니다 (`programId`, `programName`, `pending`, `answered`, `total`, `unreadCount`).
없으면 건 리스트(`items`)를 `programId`(없으면 프로그램명)로 묶어 동일 형태로 만듭니다.
행 클릭은 `inq_prog=<programId>`. 건 단위 `unread`가 없으면 답변대기를 신규로 봅니다.

## 일정 위젯 노출

Me preferences `assignedProgramTypes`가 오면 그 유형만 일정 위젯을 붙입니다.
필드가 없으면 `getProgramScheduleKindsForAdminUser`(MASTER 4유형, 그 외 mock ACL)로 폴백합니다.
빈 배열이면 일정 위젯을 숨깁니다.

## Query params

목록 조회 쿼리는 평탄 키입니다 (`?programIds=1,2`). Orval `*Params`와 동일.

| endpoint | 쿼리 |
|----------|------|
| `/recruitments` | `programIds` (콤마), `programType` |
| `/program-schedules` | `programIds`, `programType`, `dateFrom`, `dateTo` |
| `/program-inquiries` | `programIds` |
| `/kpi-progress` | `programIds` |

---

## Out of scope (mock 유지)

- `getPendingActionCounts`, `statistics-service`, `instructor-activity-service`
- `unified-activity-feed`
- 비-ADMIN 역할 홈 위젯 (홈 redirect로 미노출)

### 레거시 위젯 (ADMIN 홈 미노출) — API 필요 여부

`buildAdminDashboardWidgets`에 포함되지 않은 위젯(`overall-statistics-cards`, `pending-actions-row`, `monthly-*`, `unified-activity-feed` 등)은 **현재 홈 재도입 계획 없음 → 전용 API 설계 보류**. 홈에 다시 올릴 때 백엔드와 집계 API 스펙을 별도 협의한다.

**Last updated:** 2026-08-26
