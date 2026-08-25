# 로그 관리 API 연동 명세

보안 설정(로그 관리) `/logs/*` 화면과 Swagger `/api/logs/*` 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)  
**백엔드 핸드오프 (전환률·미적용 API)**: [logs-api-conversion-status-backend-handoff.md](./logs-api-conversion-status-backend-handoff.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,logs` | `isRealApiModuleEnabled('logs')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

권한: `LOG_READ` — **MASTER 전용**. (`LOG_WRITE` 상태 변경은 OpenAPI에만 있고 CMS UI는 호출하지 않음)

---

## Endpoint ↔ UI

| Swagger endpoint | 프론트 query key | 서비스 | UI |
|------------------|------------------|--------|-----|
| `GET /file-access` | `get_api_logs_file-access` | `getFileDownloadLogsList()` | 파일 다운로드 이력 |
| `GET /privacy-access` | `get_api_logs_privacy-access` | `getPersonalInfoAccessLogsList()` | 개인정보 조회 이력 |
| `GET /member-logins` (OpenAPI 미등재) | `get_api_logs_member-logins` | `getMemberLoginLogsList()` | 회원 로그인 이력 |
| `GET /system-issues` | `get_api_logs_system-issues` | `getBugIssueLogsList()` | 버그/이슈 이력 (목록만) |

OpenAPI의 `GET /system-issues/{id}` · `PATCH /system-issues/{id}/status`는 **CMS UI 미연결**. 버그/이슈 이력은 상세 페이지·모달이 없고 행 클릭도 하지 않습니다.

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
- **회원 로그인 이력만 예외:** CMS OpenAPI에 엔드포인트가 없어 remote 실패·미로그인 시 mock(`data/mock/member-login-logs.ts`)을 표시합니다.
  - 기획: 목록 진입·조회 시 최신 데이터 — `staleTime: 0`, `refetchOnMount: 'always'`
  - 기획: 수집일로부터 1개월 보관 후 파기 — `filterMemberLoginLogsByRetention()` (mock·remote 공통)
  - 엑셀 파일명: `[JA Korea] CMS 어드민_회원 로그인 이력_YYMMDD` (현재 조회 목록만)
  - IP 마스킹 없음

---

## 필터 params (스모크 기준)

| 화면 | URL prefix | API `params` 키 |
|------|------------|-----------------|
| 파일 다운로드 | `fdl_*` | `fileName`, `userName`, `from`, `to` |
| 개인정보 조회 | `pia_*` | `accessPurpose`, `accessorName`, `from`, `to` |
| 회원 로그인 | `mlh_*` | `adminName`/`name`, `loginId`, `from`, `to` |
| 버그/이슈 | `bil_*` | `userName`, `from`, `to` |

백엔드 handoff와 불일치 시 `logs-filter-params.ts`만 수정합니다.

**필터 동작:** 조회 버튼 → URL(`fdl_*` 등) 갱신 → React Query key(`searchParams.toString()`) 변경 → API `params` 재조회. 테이블 `filterFn`은 **정렬만** 수행하고 서버 필터 결과를 그대로 표시합니다.

**버그/이슈 이력:** 목록 `GET /system-issues`만 배선. 개인정보 조회·회원 로그인 이력과 같이 행 클릭·상세 화면이 없습니다.

**개인정보 조회 대상:** DTO에 `targetName`(또는 동등 키)이 오면 `조회 대상` 컬럼에 표시하고, 없으면 `-`입니다.

**회원 로그인 이력:** handwritten `GET /api/admin/logs/member-logins`. 성공 시 응답 배열/`items`를 매핑하고, 404 등 실패 시 mock 130건(최근 1개월 이내)으로 대체합니다. 화면에는 보관 기간을 지난 건이 노출되지 않습니다.

**Last updated:** 2026-08-24
