# 대시보드 API 연동 명세

관리자 홈(`/`) 위젯과 Swagger `/api/admin/dashboard/*` 매핑입니다.

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
| `GET /recruitments` | `get_admin_dashboard_recruitments` | `getRecruitmentStatusList()` | 모집 현황 위젯 |
| `GET /recruitments` (options) | `get_admin_dashboard_program_options` | `getDashboardProgramOptions()` | 설정 모달·일정 위젯 프로그램 메타 |
| `GET /kpi-progress` | `get_admin_dashboard_kpi-progress` | `getKpiAchievementList()` | KPI 위젯 |
| `GET /program-inquiries` | `get_admin_dashboard_program-inquiries` | `getProgramInquiryStatusList()` | 문의 현황 위젯 |
| `GET /program-schedules` | `get_admin_dashboard_program-schedules` | `getDashboardScheduleEvents()` | 프로그램 일정 위젯 (remote 시 API-only) |
| `GET/PUT /preferences` | `get/save_admin_dashboard_preferences` | `dashboard-preferences-service` | 설정·DnD layout SSOT |
| `GET /shortcuts` | `get_admin_dashboard_shortcuts` | `getDashboardShortcuts()` | 바로가기 메타 (badge는 mock) |
| `GET /log-alerts` | `get_admin_dashboard_log-alerts` | `getDashboardLogAlerts()` | MASTER 로그 알림 위젯 |

**preferences_only:** `shortcuts/visibility`, `widgets/layout`, `program-filters` granular API는 호출하지 않음.

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/dashboard/` |
| HTTP 래퍼 | `features/dashboard/api/dashboard-api-client.ts` |
| mock/실 분기 | `features/dashboard/api/admin-dashboard-service.ts` |
| DTO adapter | `features/dashboard/api/adapters/` |
| Query keys | `features/dashboard/api/dashboard-query-keys.ts` |

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

---

## KPI adapter

API는 목표값만 제공. `achieved: null` → UI `-` 표시. mock 모드는 기존 달성 수치 유지.

---

## Out of scope (mock 유지)

- 알림 **목록** (`notification-service`)
- `getPendingActionCounts`, `statistics-service`, `instructor-activity-service`
- `unified-activity-feed`
- 바로가기 **배지 count** (shortcuts API 스키마 미제공 — 백엔드 협의 후 연동)

**Last updated:** 2026-06-12
