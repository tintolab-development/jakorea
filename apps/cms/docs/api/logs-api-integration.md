# 로그 관리 API 연동 명세

보안 설정(로그 관리) `/logs/*` 화면과 Swagger `/api/logs/*` 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,logs` | `isRealApiModuleEnabled('logs')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

권한: `LOG_READ` / `LOG_WRITE`(상태 변경) — **MASTER 전용**.

---

## Endpoint ↔ UI

| Swagger endpoint | 프론트 query key | 서비스 | UI |
|------------------|------------------|--------|-----|
| `GET /file-access` | `get_api_logs_file-access` | `getFileDownloadLogsList()` | 파일 다운로드 이력 |
| `GET /privacy-access` | `get_api_logs_privacy-access` | `getPersonalInfoAccessLogsList()` | 개인정보 조회 이력 |
| `GET /system-issues` | `get_api_logs_system-issues` | `getBugIssueLogsList()` | 버그/이슈 이력 |
| `GET /system-issues/{id}` | `get_api_logs_system-issues_issueId` | `getSystemIssueDetail()` | 버그/이슈 상세 모달 |
| `PATCH /system-issues/{id}/status` | `patch_api_logs_system-issues_issueId_status` | `updateSystemIssueStatus()` | 상세 모달 상태 저장 |

**별도 (write):** `POST /api/users/{memberId}/privacy/unmask` — 개인정보 해제 시 감사 이력 생성 (`privacy-unmask-fetcher.ts`).

`/api/files/access-logs`는 로그 관리 화면과 **다른** 파일 도메인 API입니다.

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/logs/` |
| HTTP 래퍼 | `features/logs/api/logs-api-client.ts` |
| API 서비스 | `features/logs/api/admin-logs-service.ts` |
| DTO adapter | `features/logs/api/adapters/logs-adapters.ts` |
| Query keys | `features/logs/api/logs-query-keys.ts` |
| URL → API params | `features/logs/api/logs-filter-params.ts` |

---

## TanStack Query 캐시

- Key: `['cms', 'logs', …]` — `logsQueryKeys`
- `logout` / `completeAdminAuth` → `clearLogsQueryCache()`
- API 실패 시 `LogsQueryError` 표시 (mock fallback 없음)

---

## 필터 params (스모크 기준)

| 화면 | URL prefix | API `params` 키 |
|------|------------|-----------------|
| 파일 다운로드 | `fdl_*` | `fileName`, `userName`, `from`, `to` |
| 개인정보 조회 | `pia_*` | `accessPurpose`, `accessorName`, `from`, `to` |
| 버그/이슈 | `bil_*` | `userName`, `from`, `to` |

백엔드 handoff와 불일치 시 `logs-filter-params.ts`만 수정합니다.

**Last updated:** 2026-06-12
