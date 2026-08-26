# 로그 관리 API 연동 명세

보안 설정(로그 관리) `/logs/*` 화면과 Swagger `/api/admin/logs/*` 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)  
**백엔드 핸드오프 (전환률·미적용 API)**: [logs-api-conversion-status-backend-handoff.md](./logs-api-conversion-status-backend-handoff.md)  
**백엔드 Cursor 프롬프트**: [logs-api-backend-cursor-prompt.md](./logs-api-backend-cursor-prompt.md)  
갭 목록: [logs-api-backend-gaps.md](./logs-api-backend-gaps.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,logs` | `isRealApiModuleEnabled('logs')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

권한: **MASTER + `LOG_READ`**. (`LOG_WRITE` 상태 변경·버그 상세 GET/PATCH는 OpenAPI에만 있고 CMS UI는 호출하지 않음)

---

## Endpoint ↔ UI

| Swagger endpoint | 프론트 query key | 서비스 | UI |
|------------------|------------------|--------|-----|
| `GET /api/admin/logs/file-access` | `get_api_logs_file-access` | `getFileDownloadLogsPage()` | 파일 다운로드 이력 |
| `GET /api/admin/logs/privacy-access` | `get_api_logs_privacy-access` | `getPersonalInfoAccessLogsPage()` | 개인정보 조회 이력 |
| `GET /api/admin/logs/member-logins` | `get_api_logs_member-logins` | `getMemberLoginLogsPage()` | 회원 로그인 이력 |
| `GET /api/admin/logs/system-issues` | `get_api_logs_system-issues` | `getBugIssueLogsPage()` | 버그/이슈 이력 (목록만) |

OpenAPI의 `GET /system-issues/{id}` · `PATCH /system-issues/{id}/status`는 **CMS UI 미연결**. 버그/이슈 이력은 상세 페이지·모달이 없고 행 클릭도 하지 않습니다. **export API 없음** — 엑셀은 화면에서 로드된 행을 FE가 처리합니다.

**별도 (write):** `POST /api/users/{memberId}/privacy/unmask` — 개인정보 해제 시 감사 이력 생성 (`privacy-unmask-fetcher.ts`).

`/api/files/access-logs`는 로그 관리 화면과 **다른** 파일 도메인 API입니다.

---

## 목록 페이지네이션

응답은 최상위 배열이 아니라 `items` 래퍼입니다.

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "hasNext": false
}
```

- query: 기존 필터 + `page`(0-base, 기본 0) + `size`(기본 20, 최대 100). size를 생략하면 20건만 옵니다.
- 무한스크롤: `page`를 0,1,2… 증가시키며 `hasNext=false`까지 호출 (`useInfiniteQuery`).
- 화면 「총 N건」: `totalElements` (`items.length` 사용 금지).

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

- Key: `['cms', 'logs', …, searchParamsKey]` — `logsQueryKeys` (page는 `pageParam`, 필터 키에 넣지 않음)
- Class C + F, `staleTime: 30s`, `gcTime: 10m`, `retry: false` (403 재시도 없음)
- `logout` / `completeAdminAuth` → `clearLogsQueryCache()`
- API 실패 시 `LogsQueryError` 표시 (**4화면 모두 mock fallback 없음**)
- 회원 로그인 이력:
  - 기획: 수집일로부터 1개월 보관 후 파기 — 사용자가 `from`을 보낸 경우에만 cutoff로 clamp. 미지정 시 쿼리에 `from`을 넣지 않음 (서버 기본 1개월을 신뢰)
  - 엑셀 파일명: `[JA Korea] CMS 어드민_회원 로그인 이력_YYMMDD` (현재 로드된 목록만)
  - IP 마스킹 없음

---

## 필터 params (스모크 기준)

| 화면 | URL prefix | API query 키 |
|------|------------|-----------------|
| 파일 다운로드 | `fdl_*` | `fileName`, `userName`, `from`, `to`, `page`, `size` |
| 개인정보 조회 | `pia_*` | `accessPurpose`, `accessorName`, `from`, `to` (+ 선택 `targetName`), `page`, `size` |
| 회원 로그인 | `mlh_*` | `adminName`/`name`, `loginId`, `from`, `to`, `page`, `size` |
| 버그/이슈 | `bil_*` | `userName`, `from`, `to` (+ 선택 `status`, `severity`), `page`, `size` |

백엔드 handoff와 불일치 시 `logs-filter-params.ts`만 수정합니다.

**필터 동작:** 조회 버튼 → URL(`fdl_*` 등) 갱신 → React Query key(`searchParams.toString()`) 변경 → page 0부터 재조회. 테이블 `filterFn`은 **정렬만** 수행하고 서버 필터 결과를 그대로 표시합니다.

**버그/이슈 이력:** 목록 `GET /system-issues`만 배선. 개인정보 조회·회원 로그인 이력과 같이 행 클릭·상세 화면이 없습니다.

**개인정보 조회 대상:** DTO에 `targetName`(또는 동등 키)이 오면 `조회 대상` 컬럼에 표시하고, 없으면 `-`입니다.

**Last updated:** 2026-08-26
