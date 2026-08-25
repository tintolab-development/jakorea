# 보안 설정(로그 관리) — 백엔드 갭 요청

> **SSOT**: 전환률 · 화면별 계약 · 미적용 API 스펙은  
> [**logs-api-conversion-status-backend-handoff.md**](./logs-api-conversion-status-backend-handoff.md)  
> 본 문서는 짧은 갭 목록입니다. 백엔드 전달 시 위 문서를 우선하세요.

CMS LNB **보안 설정(로그 관리)** 4화면의 OpenAPI v9 대조 결과입니다.  
프론트 연동 명세: [logs-api-integration.md](./logs-api-integration.md)

**작성일**: 2026-08-24  
**OpenAPI**: `apps/cms/openapi/logs.openapi.json` (tag: 로그 관리)

프론트는 목록 GET 3종(파일·개인정보·버그)을 OpenAPI로 호출하고, **회원 로그인**은 handwritten `GET /api/admin/logs/member-logins`입니다. 아래는 **스펙에 없는 API**, **있는 API의 계약 구멍**, **확인만 필요한 항목**입니다.

---

## 현재 OpenAPI (5개) vs FE

| Method | Path | FE |
|--------|------|----|
| GET | `/api/admin/logs/file-access` | 파일 다운로드 이력 목록 — 배선됨 |
| GET | `/api/admin/logs/privacy-access` | 개인정보 조회 이력 목록 — 배선됨 |
| GET | `/api/admin/logs/system-issues` | 버그/이슈 이력 목록 — 배선됨 |
| GET | `/api/admin/logs/system-issues/{issueId}` | OpenAPI만. CMS는 상세 페이지·모달 없음 — FE 미연결 |
| PATCH | `/api/admin/logs/system-issues/{issueId}/status` | OpenAPI만. CMS UI 미연결 |

Notion 4번 **메일 발송 이력**은 기획 보류이며 OpenAPI에 없습니다.

---

## A. 존재하지 않는 API (신규 엔드포인트)

| 우선 | 제안 경로 | 이유 |
|------|-----------|------|
| **P0** | `GET /api/admin/logs/member-logins` OpenAPI 등재 + 구현 | FE가 이미 호출. 실패 시 **mock 130건**이 보임 |
| P1 | 네 목록 GET을 **Page 응답**으로 바꾸거나 `page`, `size`, `total` 추가 | 현재 무한 배열. 로그 적재 시 화면이 전체를 받음 |
| P1 | `GET /api/admin/logs/{file-access\|privacy-access\|system-issues\|member-logins}/export` (필터 동일, **감사로그 필수**) | OpenAPI가 export를 감사 실패 시 fail-closed로 규정. 개인정보 조회 이력 엑셀은 클라 다운로드로 정책 위반 가능 |
| P2 | `GET /api/admin/logs/system-issues/{issueId}/stack-trace` 또는 상세에 `stackTrace` 본문 포함 | OpenAPI 상세에 `stackTraceAvailable`만 있음. CMS UI는 상세를 열지 않음 |
| P2 | `GET /api/admin/logs/mail-sends` (가칭) | Notion 4. 메일 발송 이력(보류). 필터: 사용자, 기간 / 컬럼: No, 발생 화면, 에러 메시지, 사용자, 발생일시 |

**요청하지 않는 것**

- `POST /logs/file-access` — 실제 파일 다운로드 시 서버가 기록하는 쪽이 맞음. CMS는 조회 전용.
- `POST /logs/privacy-access` — 회원 unmask API가 이미 감사 생성.
- 대시보드 `GET /api/admin/dashboard/log-alerts` — v9에서 삭제됨, 로그 LNB 아님.

---

## B. 있는 API의 스펙 구멍 (계약 수정 · 실질 P0)

### 1. 필터 키를 OpenAPI에 명시

지금 목록 3종의 query `params`는 `{ [key: string]: string }` 가방입니다. 프론트가 보내는 키(확정안):

| 화면 | API `params` 키 |
|------|-----------------|
| file-access | `fileName`, `userName`, `from`, `to` (`YYYY-MM-DD`) |
| privacy-access | `accessPurpose`, `accessorName`, `from`, `to` (+ 조회 대상이면 `targetName`) |
| system-issues | `userName`, `from`, `to` (+ 선택 `status`, `severity`) |

스키마에 위 키를 property로 적어 주세요. 이름이 다르면 알려 주시면 프론트 맵만 바꿉니다.

### 2. 버그 목록 `id` vs 상세 `issueId` (우선순위 낮음)

- 목록 `BugIssueLogFrontendResponse.id`: **string**
- 상세·PATCH path `issueId`: **int64**

CMS 버그/이슈 이력은 **목록만** 쓰고 상세 GET·PATCH를 호출하지 않습니다. 나중에 상세 화면을 붙일 때를 대비해 **같은 식별자·같은 타입**이면 좋습니다. (권장: 목록에도 `issueId: int64` 또는 `id`를 숫자 문자열로 고정)

### 3. 개인정보 목록에 조회 대상 필드

Notion **개인정보 조회 이력** 컬럼: 개인정보 열람 **대상자 명**.  
현재 DTO(`accessItem`, `accessPurpose`, `accessorName`, …)에 대상자 필드가 없습니다.

제안: `targetName` (string). 프론트는 필드가 오면 `조회 대상` 컬럼에 표시하고, 없으면 `-`입니다.

### 4. `PATCH .../status`의 `status` enum (우선순위 낮음)

지금 `SystemIssueStatusUpdateRequest.status`는 자유 문자열입니다.  
허용값·409 전이 규칙을 OpenAPI enum/설명으로 문서화해 주세요. CMS UI는 현재 이 PATCH를 호출하지 않습니다.

### 5. 버그 목록에 `issueStatus` / `severity`

상세 DTO에만 있으면 목록 배지·필터가 불가합니다. Notion은 **행 액션 없음**이므로, 상태를 보려면 목록에 필요합니다.

---

## C. 확인만 하면 되는 것

1. 세 목록이 정말 전체 dump인지, 서버 기본 기간/건수 제한이 있는지.
2. file-access 기록이 파일 다운로드 API에서 자동 적재되는지 (아니면 이력이 비어 있음).
3. privacy-access가 unmask 성공 건만인지, 마스킹 화면 조회도 남는지.

---

## 프론트 진행 상태 (참고)

- 필터 키는 위 B-1 확정안으로 전송. 서버 필터를 신뢰하고 클라 이중 필터는 정렬만 남김.
- 버그/이슈는 목록 GET만 호출. 상세 GET·상태 PATCH는 CMS UI 미연결.
- 엑셀은 현재 클라 테이블 dump. P1 export가 오면 개인정보 화면의 클라 엑셀은 제거를 검토합니다.
