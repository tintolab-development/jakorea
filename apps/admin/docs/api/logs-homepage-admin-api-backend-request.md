# Homepage Admin 로그 관리 — Backend API 신규 구현 요청

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **수신** | Homepage Backend (`JAHOMEADMINBACK`) |
| **요청자** | Homepage Admin FE |
| **앱** | Homepage Admin (`apps/admin`) — **JA CMS와 별도** |
| **우선순위** | 높음 — FE 화면·필터·mock 완료, remote 연동 대기 |

---

## 1. 요청 요약

Homepage Admin 「로그 관리」5화면 중 **2개는 이미 Homepage API 연동 완료**입니다.  
나머지 **3화면은 Homepage Backend API가 없어 FE mock만 동작**합니다.

| # | 화면 | FE 경로 | Homepage API | 요청 |
|---|------|---------|--------------|------|
| 1 | 개인정보 조회 이력 | `/logs/pii-access` | `GET /api/admin/logs/privacy-access` (+ export) | **완료** (참고만) |
| 2 | 파일 다운로드 이력 | `/logs/file-download` | `GET /api/admin/logs/file-downloads` (+ export) | **완료** (참고만) |
| 3 | 회원 로그인 이력 | `/logs/member-login` | **없음** | **신규 구현** |
| 4 | 관리자 계정 처리 이력 | `/logs/admin-account` | **없음** | **신규 구현** |
| 5 | 버그/이슈 이력 | `/logs/bugs` | **없음** | **신규 구현** |

### 제품 결정 (중요)

- Homepage Admin 로그 관리는 **JA CMS 로그와 개별로 따로 구현**되어야 합니다.
- CMS `GET /api/admin/logs/system-issues` · CMS privacy/file-access 등을 **프록시·복제·공유 SoT로 쓰지 마세요.**
- Homepage 전용 스키마·쓰기(발생 시점 append)·Admin list/export API가 필요합니다.
- 기존 V14 주석(*JA CMS-owned login/account-processing logs remain outside this schema*) 및 `LOGS_OWNERSHIP_HANDOFF.md`의 “CMS로만 요청” 방향은 **본 요청으로 재검토·번복**해 주세요. Homepage Admin 화면이 별도로 존재하므로 **Homepage 소유 API가 필요합니다.**

---

## 2. 공통 계약 (기존 privacy / file-download 와 동일 패턴)

기존 구현을 그대로 따르세요: `HomepageLogAdminController` · `homepage_privacy_access_log` / `homepage_file_download_log`.

| 항목 | 요구 |
|------|------|
| Base path | `/api/admin/logs/...` |
| Auth | Homepage Admin JWT (기존과 동일) |
| 권한 | 기존 로그 조회와 동일 계열 권장 (`HOMEPAGE_VIEW` + 필요 시 PII/감사 권한). 확정 값을 OpenAPI에 명시 |
| Cache | `Cache-Control: no-store` |
| 페이지 | `page`(0-based) · `size` **default 20**, max 100 |
| 응답 | 기존과 동일한 page envelope (`items`, `totalCount`, …) |
| 기간 | `from` / `to` = `YYYY-MM-DD`, Asia/Seoul 일자 기준 (기존 로그 API와 동일) |
| 검색 | 이름·ID·메시지 등은 **대소문자 무시 contains** (기존 `adminName` 등과 동일) |
| 테이블 | **append-only** (UPDATE/DELETE 금지 · privacy/file-download 과 동일) |
| OpenAPI | Homepage Admin OpenAPI에 포함 → FE Orval `logs` subset 재생성 |
| Export | list와 **동일 필터**의 `GET …/export` XLSX (privacy/file-download 과 동일). 1차는 list만도 가능하나 export 권장 |
| 로컬 시드 | `scripts/seed_logs_local.sql`에 append 또는 별도 `seed_logs_*_local.sql` · `trace_id`(또는 동등 unique) idempotent INSERT |

---

## 3. API 1 — 회원 로그인 이력

| 항목 | 내용 |
|------|------|
| FE | `/logs/member-login` |
| 기획 | https://app.notion.com/p/3acf3e2a77d08160bf57e866aa3dc250 |
| FE mock SSOT | `apps/admin/src/features/member-login-log/api/store.ts` |
| FE 타입 | `apps/admin/src/entities/member-login-log/model/types.ts` |

### 제안 path

| Method | Path |
|--------|------|
| GET | `/api/admin/logs/member-logins` |
| GET | `/api/admin/logs/member-logins/export` (권장) |

### Query

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `audience` | **예** | `ADMIN` \| `USER` (FE 탭: 관리자 / 사용자). OpenAPI enum 확정 |
| `name` | 아니오 | 이름 contains |
| `loginId` | 아니오 | 로그인 ID contains |
| `from` / `to` | 아니오 | 로그인 일자 |
| `page` / `size` | 아니오 | default `0` / `20` |

### 응답 item (FE 도메인 매핑)

| FE 필드 | 타입 | 설명 |
|---------|------|------|
| `id` | string/number | |
| `audience` | admin \| user | 응답 enum → FE `admin`/`user` 매핑 가능하면 됨 |
| `name` | string | 이름 |
| `loginId` | string | 로그인 ID (이메일 등) |
| `loggedAt` | string (ISO) | 로그인 일시 |
| `ip` | string | 클라이언트 IP |

### 저장·발생

- Homepage Admin / Platform(사용자) **로그인 성공 시** Homepage 로그 테이블에 append.
- CMS 로그인 이력을 읽어 오지 않음. **Homepage 세션·인증 흐름에서 직접 기록.**

---

## 4. API 2 — 관리자 계정 처리 이력

| 항목 | 내용 |
|------|------|
| FE | `/logs/admin-account` |
| 기획 | https://app.notion.com/p/3acf3e2a77d081659ac0fd72dd87def0 |
| FE mock SSOT | `apps/admin/src/features/admin-account-log/api/store.ts` |
| FE 타입 | `apps/admin/src/entities/admin-account-log/model/types.ts` |

### 제안 path

| Method | Path |
|--------|------|
| GET | `/api/admin/logs/admin-account-actions` |
| GET | `/api/admin/logs/admin-account-actions/export` (권장) |

### Query

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `adminName` 또는 `name` | 아니오 | 관리자명 contains |
| `loginId` | 아니오 | 로그인 ID contains |
| `actionType` | 아니오 | 아래 enum exact |
| `from` / `to` | 아니오 | 처리 일자 |
| `page` / `size` | 아니오 | default `0` / `20` |

### `actionType` (FE 라벨)

| 코드 (FE) | 라벨 |
|-----------|------|
| `password_change` | 비밀번호 변경 |
| `profile_update` | 계정 정보 수정 |
| `permission_change` | 권한 변경 |
| `account_create` | 계정 생성 |
| `account_deactivate` | 계정 비활성 |

BE enum 네이밍은 OpenAPI에서 확정하되, **위 5종과 1:1 매핑** 가능해야 합니다.

### 응답 item

| FE 필드 | 타입 | 설명 |
|---------|------|------|
| `id` | string/number | |
| `name` | string | 대상 관리자명 |
| `loginId` | string | |
| `actionType` | enum | 위 표 |
| `processedAt` | string (ISO) | 처리 일시 |
| `ip` | string | |

### 저장·발생

- **Homepage Admin 계정** 생성·비활성·프로필/권한/비밀번호 변경 시 append.
- `homepage_admin_audit_log`(콘텐츠 mutation audit)와 **화면·스키마를 혼동하지 말 것.** 본 API는 「관리자 계정 처리 이력」화면 전용입니다.
- CMS 관리자 계정 이력을 복제하지 않음.

---

## 5. API 3 — 버그/이슈 이력

| 항목 | 내용 |
|------|------|
| FE | `/logs/bugs` |
| 기획 | https://app.notion.com/p/3acf3e2a77d08134b1c0e4193918ac86 |
| FE mock SSOT | `apps/admin/src/features/bug-issue-log/api/store.ts` |
| FE 타입 | `apps/admin/src/entities/bug-issue-log/model/types.ts` |

### 제안 path

| Method | Path |
|--------|------|
| GET | `/api/admin/logs/system-issues` |
| GET | `/api/admin/logs/system-issues/export` (권장) |

> CMS에도 유사 path가 있을 수 있으나 **호스트·스키마·데이터가 다름.** Homepage Admin은 Homepage API만 호출합니다.

### Query

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `userName` | 아니오 | 사용자명 contains |
| `from` / `to` | 아니오 | 발생 일자 |
| `page` / `size` | 아니오 | default `0` / `20` |

### 응답 item (목록 화면 최소)

| FE 필드 | 타입 | 설명 |
|---------|------|------|
| `id` | string/number | |
| `errorMessage` | string | 에러 메시지 |
| `userName` | string | 발생 사용자/관리자명 |
| `occurredAt` | string (ISO) | 발생 일시 |

상세·상태 변경(CMS식 PATCH)은 **1차 범위 밖**. 목록(+export)만 우선.

### 저장·발생

- Homepage Admin(또는 Homepage 관련 클라이언트)에서 수집한 클라이언트/서버 오류를 Homepage 테이블에 append.
- CMS `system-issues` 테이블/API를 공유하지 않음.

---

## 6. FE 연동 계획 (API 제공 후)

1. OpenAPI fetch → Orval `logs` subset 재생성  
2. feature `capabilities` → `shouldUseHomepageRemoteApi()`  
3. `mappers` · `service` · hooks (`size=20`, filter → query)  
4. 로컬 시드 후 API 로그인으로 스모크  

현재 FE는 `useListFilterUrl`까지 준비되어 있어, **계약만 맞으면 즉시 remote 전환 가능**합니다.

---

## 7. 수락 기준 (Definition of Done) — FE 확인 (2026-08-13)

- [x] 위 3개 list(+ export)가 Homepage OpenAPI에 공개됨  
- [x] FE Orval 재생성 · remote 전환 (`shouldUseHomepageRemoteApi`)  
- [x] 로컬 시드 `seed_logs_admin_screens_local.sql`  
- [ ] 권한·발생 시점 쓰기 운영 검증 (BE)

**Last updated:** 2026-08-13
