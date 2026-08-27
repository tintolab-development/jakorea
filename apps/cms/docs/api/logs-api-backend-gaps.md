# 보안 설정(로그 관리) — 백엔드 갭 요청

> **2026-08-26 SSOT**: 백엔드 Cursor 실행 프롬프트는  
> [**logs-api-backend-cursor-prompt.md**](./logs-api-backend-cursor-prompt.md)  
> 전환률 · 화면별 계약 · 미적용 API 스펙 스냅샷: [**logs-api-conversion-status-backend-handoff.md**](./logs-api-conversion-status-backend-handoff.md)  
> FE 연동: [logs-api-integration.md](./logs-api-integration.md)

CMS LNB **보안 설정(로그 관리)** 4화면의 OpenAPI 대조입니다.

**작성일**: 2026-08-26  
**OpenAPI**: `apps/cms/openapi/logs.openapi.json` (tag: 로그 관리)

프론트는 목록 GET 4종을 OpenAPI로 호출합니다. **회원 로그인 mock fallback은 제거됨** — 실패 시 에러 UI만 표시합니다.

---

## 현재 OpenAPI vs FE

| Method | Path | FE |
|--------|------|----|
| GET | `/api/admin/logs/member-logins` | 회원 로그인 이력 — 배선됨, mock 없음 |
| GET | `/api/admin/logs/file-access` | 파일 다운로드 이력 — 배선됨 |
| GET | `/api/admin/logs/privacy-access` | 개인정보 조회 이력 — 배선됨 |
| GET | `/api/admin/logs/system-issues` | 버그/이슈 이력 목록 — 배선됨 |
| GET | `/api/admin/logs/system-issues/{issueId}` | OpenAPI만. CMS 상세 없음 — FE 미연결 (기획: 행 액션 없음) |
| PATCH | `/api/admin/logs/system-issues/{issueId}/status` | OpenAPI만. CMS UI 미연결 |

Notion **메일 발송 이력**은 기획 보류이며 OpenAPI에 없습니다.

---

## A. 남아 있는 API 요청

| 우선 | 제안 경로 | 이유 |
|------|-----------|------|
| **P0** | `GET /api/admin/logs/member-logins` **구현·스테이징 200** + **1개월 서버 파기** | OpenAPI·FE 배선 완료. 404면 CMS가 빈 mock이 아니라 에러를 보여 줌 |
| **P0** | 목록 query `params` 가방 **required 제거**, 플랫 키만 바인딩 | FE는 `?fileName=` `?adminName=` 만 보냄 |
| **P0** | 파일 다운로드 API가 `file-access` 행을 **자동 적재** | CMS는 POST하지 않음. 적재 없으면 빈 목록 |
| **P0** | unmask 성공 시 `privacy-access` 감사 + `targetName` | 조회 대상 컬럼. 경로 `/api/admin/users/{id}/privacy/unmask` |
| P1 | 네 목록 GET을 **Page 응답**으로 바꾸거나 `page`, `size`, `total` 추가 | 현재 무한 배열. 로그 적재 시 화면이 전체를 받음 |
| P1 | `GET /api/admin/logs/{file-access\|privacy-access\|system-issues\|member-logins}/export` (필터 동일, **감사 fail-closed**) | 지금은 클라 테이블 dump. 개인정보·IP 포함 |
| P2 | `GET /api/admin/logs/system-issues/{issueId}/stack-trace` 또는 상세에 `stackTrace` 본문 포함 | OpenAPI 상세에 `stackTraceAvailable`만 있음. CMS UI는 상세를 열지 않음 |
| P2 | `GET /api/admin/logs/mail-sends` (가칭) | Notion 메일 발송 이력(보류). 필터: 사용자, 기간 / 컬럼: No, 발생 화면, 에러 메시지, 사용자, 발생일시 |

**요청하지 않는 것**

- `POST /logs/file-access` — 실제 파일 다운로드 시 서버가 기록하는 쪽이 맞음. CMS는 조회 전용.
- `POST /logs/privacy-access` — 회원 unmask API가 이미 감사 생성.
- 대시보드 `GET /api/admin/dashboard/log-alerts` — v9에서 삭제됨, 로그 LNB 아님.

---

## B. 있는 API의 스펙 구멍 (계약 수정)

### 1. `params` 가방 required 제거 (P0)

플랫 키는 OpenAPI에 이미 있다. 그런데 `params: { [key: string]: string }` 가 **required**로 남아 있다. FE는 가방을 보내지 않고 `?fileName=` `?adminName=` 만 보낸다. Spring이 중첩 `params[fileName]`만 받으면 필터가 무시된다.

프론트가 보내는 키(확정안):

| 화면 | API 쿼리 키 |
|------|-----------------|
| file-access | `fileName`, `userName`, `from`, `to` (`YYYY-MM-DD`) |
| privacy-access | `accessPurpose`, `accessorName`, `from`, `to` (+ 조회 대상이면 `targetName`) |
| system-issues | `userName`, `from`, `to` (+ 선택 `status`, `severity`) |
| member-logins | `adminName`/`name`, `loginId`, `from`, `to` |

### 2. 버그 목록 `id` vs 상세 `issueId` (P2)

목록 `id`는 int64로 맞춰짐. 상세 path도 int64. CMS는 상세를 호출하지 않음 (기획: 행 액션 없음). `screenName`은 DTO에 남아도 됨 — **CMS 컬럼에서는 제거됨**.

### 3. `targetName` (스키마 있음, 값 확인 P0)

OpenAPI `PersonalInfoAccessLogFrontendResponse.targetName` 있음. 서버가 안 채우면 화면은 `-`.

### 4. `PATCH .../status` enum (P2)

CMS UI 미연결. 상세를 붙이지 말 것.

### 5. 버그 목록 `issueStatus` / `severity`

DTO에 있음. Notion 컬럼에는 없음. CMS는 표시하지 않음.

---

## C. 확인만 하면 되는 것

1. 목록이 Page인지 (`totalElements` = 화면 「총 N건」). size 기본 20, 최대 100. 세 목록이 정말 전체 dump인지, 서버 기본 기간/건수 제한이 있는지.
2. file-access가 실제 파일 다운로드에서 자동 적재되는지.
3. privacy-access가 unmask 성공 건만인지, 마스킹 화면 조회도 남는지.
4. 회원 로그인 1개월 파기를 **서버**가 하는지.

---

## 프론트 진행 상태 (참고)

- 4화면 모두 목록 GET 배선. **mock fallback 없음.**
- 필터 키는 플랫 쿼리. 클라 이중 필터는 일시 내림차순만.
- 버그/이슈는 목록 GET만. 「발생 화면」컬럼 제거. 상세 GET·PATCH 미연결.
- 엑셀은 현재 클라 테이블 dump (로드된 페이지). P1 export가 오면 개인정보 화면 클라 엑셀은 제거를 검토.
