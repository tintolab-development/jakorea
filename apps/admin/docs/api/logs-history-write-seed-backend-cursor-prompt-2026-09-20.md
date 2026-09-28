# Cursor prompt — Homepage Admin 로그 이력 write + 더미 시드 초기화

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약만** 맞춰라.  
질문이 필요하면 스키마가 값을 거부할 때(쿼리 타입·에러 envelope)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/logs-history-write-seed-backend-cursor-prompt-2026-09-20.md`

---

## Goal

Homepage Admin 「로그 관리」5화면은 list/export OpenAPI가 이미 있다.  
Admin FE는 JWT면 아래 GET을 호출하고, `page`/`size=20` 서버 페이징을 쓴다.  
목록 화면은 **POST를 호출하지 않는다.**

남은 서버 갭은 둘이다.

1. **발생 시점 append가 실제로 남는가.** 로그인·계정 처리·파일 다운로드·PII 조회·시스템 이슈가 Homepage 로그 테이블에 append-only로 쌓여야 한다. CMS 로그를 프록시·복제하지 마라.
2. **더미 시드가 실제 이력을 가린다.** `seed-*` prefix 행을 지우고, 로컬 부팅에서 더미 SQL이 자동 재실행되지 않게 하라. 이미 쌓인 **실제 이력은 지우지 마라** (`TRUNCATE` 금지).

완료 조건:

1. `seed-pii-*` / `seed-dl-*` / `seed-login-*` / `seed-admin-acct-*` / `seed-bug-*` 행이 로그 테이블에서 사라진다. 그 외 행은 남는다.
2. 로컬 기동·Flyway·시드 job이 `seed_logs_local.sql` / `seed_logs_admin_screens_local.sql` 을 **자동 재실행하지 않는다.**
3. Homepage Admin 로그인 성공 1회 → `GET /api/admin/logs/member-logins?audience=ADMIN` 에 그 건이 최신으로 보인다.
4. Platform(사용자) 로그인 성공 1회 → `audience=USER` list에 보인다.
5. 관리자 계정 생성·비활성·프로필/권한/비밀번호 변경 시 `admin-account-actions` 에 해당 `actionType` 이 append 된다.
6. 파일 다운로드 / 개인정보 조회 액션 시점에 해당 list에 append 된다.
7. Homepage 관련 오류 수집 시 `system-issues` 에 append 된다. 상세 PATCH는 이번 범위 밖.
8. list `page`/`size`(default `0`/`20`) · `totalCount`/`totalPages` 가 필터 결과와 맞다. export는 **page 없이** list와 **동일 필터**의 XLSX, `Cache-Control: no-store`.
9. OpenAPI에 write가 내부(서비스 레이어)인지 POST로 열려 있는지 명시한다. **Admin FE 목록은 POST하지 않는다.**
10. 작업 후 **프론트용 Cursor 프롬프트**를 이 문서 템플릿으로 작성해 회신한다.

---

## Out of scope / 금지

- CMS `GET /api/admin/logs/*` 프록시·공유 SoT
- 로그 테이블 **TRUNCATE** · 실제(비 seed prefix) 이력 삭제
- prod Flyway에 더미 카피 INSERT
- `system-issues` 상세 GET/PATCH, 상태 변경 UI
- list `size` default를 20이 아닌 값으로 올리기
- Admin FE mock localStorage 수정 (프론트 작업 아님)
- 새 list path 신설 (기존 path 유지)

---

## 1. 기존 list / export (유지)

Auth: Homepage Admin JWT. Cache: `Cache-Control: no-store`.  
기간 `from`/`to` = `YYYY-MM-DD`, Asia/Seoul 일자. 이름·ID 검색은 **대소문자 무시 contains**.

| 화면 | List | Export |
|------|------|--------|
| 회원 로그인 | `GET /api/admin/logs/member-logins` | `GET /api/admin/logs/member-logins/export` |
| 관리자 계정 처리 | `GET /api/admin/logs/admin-account-actions` | `GET /api/admin/logs/admin-account-actions/export` |
| 파일 다운로드 | `GET /api/admin/logs/file-downloads` | `GET /api/admin/logs/file-downloads/export` |
| 개인정보 조회 | `GET /api/admin/logs/privacy-access` | `GET /api/admin/logs/privacy-access/export` |
| 버그/이슈 | `GET /api/admin/logs/system-issues` | `GET /api/admin/logs/system-issues/export` |

공통 query: `page`(0-based, default 0) · `size`(default 20, max 기존 스펙 유지).  
응답 envelope: `items`, `totalCount`, `page`, `size`, `totalPages`.

### 회원 로그인 query

| name | required | 의미 |
|------|----------|------|
| `audience` | **예** | `ADMIN` \| `USER` |
| `name` | 아니오 | 이름 contains |
| `loginId` | 아니오 | 로그인 ID contains |
| `from` / `to` | 아니오 | 로그인 일자 |
| `page` / `size` | 아니오 | |

item: `id`, `audience`, `name`, `loginId`, `loggedAt`(ISO), `ip`

### 관리자 계정 처리 query

`name`, `loginId`, `actionType`(exact), `from`/`to`, `page`/`size`

`actionType` FE 코드 1:1 (값 바꾸지 마라):

| 코드 | 라벨 |
|------|------|
| `password_change` | 비밀번호 변경 |
| `profile_update` | 계정 정보 수정 |
| `permission_change` | 권한 변경 |
| `account_create` | 계정 생성 |
| `account_deactivate` | 계정 비활성 |

item: `id`, `name`, `loginId`, `actionType`, `processedAt`(ISO), `ip`

### 파일 다운로드 query (화면이 보내는 것)

`adminName`(사용자명), `fileName`, `from`/`to`, `page`/`size`  
(`assetPurpose`/`sourceType` 는 UI에 없음 — 있어도 유지, 필수로 만들지 마라)

item 매핑: `originalName`→파일명, `adminName`→사용자명, `createdAt`→다운로드 일시, `clientIp`→IP

### 개인정보 조회 query (화면이 보내는 것)

`targetName`, `adminName`(조회자명), `accessPurpose`(조회 목적), `from`/`to`, `page`/`size`  
(`action`/`targetType` 는 UI에 없음)

item 매핑: `accessPurpose`→목적, `adminName`→조회자명, `createdAt`→조회 일시, `clientIp`→IP

### 버그/이슈 query

`userName`, `from`/`to`, `page`/`size`  
item: `id`, `errorMessage`, `userName`, `occurredAt`(ISO)

Export: list와 **같은 필터**, `page`/`size` **넣지 않음**. `Content-Type` spreadsheetml, `Content-Disposition` filename.

검수:

```text
GET …/member-logins?audience=ADMIN&page=1&size=20
→ items 최대 20, totalCount 는 필터 전체, page=1
GET …/member-logins/export?audience=ADMIN
→ XLSX, 필터 전체 행, page 무시
```

---

## 2. 시드 초기화 (실제 이력이 남게)

기존 더미 (`scripts/seed_logs_local.sql`, `scripts/seed_logs_admin_screens_local.sql`)의 `trace_id` prefix:

| prefix | 대상 |
|--------|------|
| `seed-pii-*` | privacy-access |
| `seed-dl-*` | file-downloads |
| `seed-login-*` | member-logins |
| `seed-admin-acct-*` | admin-account-actions |
| `seed-bug-*` | system-issues |

필수:

1. 위 prefix **만** DELETE. 컬럼명이 `trace_id`가 아니면 동등 unique 키의 seed prefix.
2. **테이블 TRUNCATE 금지.** prefix 없는 행은 실제 이력으로 본다.
3. 앱 기동, 로컬 compose, Flyway repeatable, README 기본 시드에서 위 두 SQL **자동 실행을 제거**한다.
4. 더미가 다시 필요하면 `scripts/seed_logs_*_optin.sql` 처럼 **명시 실행 전용**. prod에 넣지 마라.
5. 초기화 후 list는 빈 페이지이거나 실제 append만 보여야 한다.

---

## 3. write 발생 시점 (필수)

append-only. UPDATE/DELETE 로그 행 금지.

| 이벤트 | 테이블/API | 비고 |
|--------|------------|------|
| Homepage Admin 로그인 성공 | member-logins `audience=ADMIN` | CMS 로그인 복사 금지 |
| Platform 사용자 로그인 성공 | member-logins `audience=USER` | |
| 관리자 계정 생성 | admin-account-actions `account_create` | |
| 계정 비활성 | `account_deactivate` | |
| 프로필 수정 | `profile_update` | |
| 권한 변경 | `permission_change` | |
| 비밀번호 변경 | `password_change` | |
| 파일 다운로드 | file-downloads | 해당 액션 시점 |
| 개인정보 조회 | privacy-access | 해당 액션 시점 |
| Homepage Admin/Platform 오류 수집 | system-issues | CMS system-issues 공유 금지 |

OpenAPI에 `POST /api/admin/logs/member-logins` 등이 있어도 **Admin 목록 FE는 호출하지 않는다.**  
내부 서비스에서 append 하고 POST는 내부/테스트용이면 OpenAPI description에 그렇게 적어라.

`ip` / `clientIp` 는 요청 클라이언트 IP. `loggedAt`/`processedAt`/`createdAt`/`occurredAt` 는 이벤트 시각(ISO).

---

## 작업 후 회신

```text
- 변경 파일:
- seed prefix DELETE 대상 테이블·컬럼:
- 자동 재시드 제거 여부: (yes/no, 어디를 끊었는지)
- TRUNCATE 사용 여부: (없어야 함)
- append 트리거 (로그인 Admin/User, 계정 5종, file, pii, issue):
- list page/totalCount 확인:
- export binary / no-store:
- OpenAPI write 공개 여부: (internal | POST 유지)
- OpenAPI 갱신 여부:
```

그리고 **프론트 변경이 필요하면** 아래 블록을 **그대로 채워** 회신하라.  
FE 레포(`jakorea`) Cursor에 붙여넣을 수 있게, 한국어 지시문으로 작성하라.  
프론트 변경이 전혀 없으면 `프론트 Cursor 프롬프트: 불필요` 한 줄.

시드만 지우고 path/스키마가 그대로면 프론트 프롬프트는 불필요해도 된다.  
**list query·item 필드·actionType 값이 바뀌면 프론트 프롬프트는 필수**다.

---

## 프론트 Cursor 프롬프트 템플릿 (백엔드가 채워 회신)

````text
# Cursor prompt — Admin 로그 관리 (write 반영 후)

대상: 프론트 레포 `jakorea`, 앱 `apps/admin`.
백엔드가 더미 시드를 지우고 실제 append를 남긴다. **추측하지 말고 아래 계약만** 반영하라.

## 하지 마라

- 로그 목록에서 create POST 호출
- mock store 제거 (Mock 로그인 전용 유지)
- `size` 를 20 초과로 올리기
- CMS 로그 API 연동

## 1. OpenAPI / Orval (스펙이 바뀐 경우만)

백엔드 스펙 경로: {BE OpenAPI 파일}
추가·변경 요약:
- {없으면 none}

Admin `logs` subset Orval을 재생성하라.

## 2. 매퍼 (필드/enum이 바뀐 경우만)

파일:
- `apps/admin/src/features/member-login-log/api/mappers.ts`
- `apps/admin/src/features/admin-account-log/api/mappers.ts`
- `apps/admin/src/features/file-download-log/api/mappers.ts`
- `apps/admin/src/features/pii-access-log/api/mappers.ts`
- `apps/admin/src/features/bug-issue-log/api/mappers.ts`

백엔드 실제 값: `{audience / actionType / 날짜 필드}`

## 3. 검증

- API 로그인 후 `/logs/member-login` 관리자 탭 → 방금 로그인이 1건으로 보인다 (더미 seed-login 문구/패턴 없음).
- Platform 로그인 후 사용자 탭에 USER 1건.
- 계정 처리 1건 후 `/logs/admin-account` 에 해당 내역.
- 엑셀은 필터 전체, 목록은 20건 페이징.
- Mock 로그인은 기존 local seed 유지.

## 작업 후 회신

- 변경 파일:
- Orval 재생성 여부:
````

**Last updated:** 2026-09-20
