# Cursor prompt — CMS 보안 설정(로그 관리) API 계약 확정

아래 지시를 **이 백엔드 레포에서 실행**하라. 질문은 기존 컨트롤러/엔티티를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

작성일: 2026-08-26  
범위: CMS LNB **보안 설정(로그 관리)** 4화면만. 메일 발송 이력은 기획 보류 — 만들지 마라.

## Goal

CMS가 호출하는 로그 목록 4개가 **기획대로 조회**되게 하라. FE는 이미 아래 경로를 친다. mock fallback은 **제거됐다**. 404/500이면 CMS는 에러 UI만 보여 준다.

완료 조건:

1. 관리자 JWT로 아래 4 GET이 **200** + Page 래퍼를 반환한다.
2. 필터는 **플랫 쿼리**다. `params[fileName]` 중첩이 아니어도 동작한다.
3. local/dev 시드로 각 목록에 **빈 화면이 아닌 샘플**이 있다. prod 마이그레이션에 넣지 마라.
4. 회원 로그인 이력은 **수집일로부터 1개월 밖 행을 서버가 반환하지 않는다** (삭제 또는 기본 조회 윈도우).
5. 파일 다운로드·개인정보 원문 조회가 일어나면 해당 로그 테이블에 **서버가 적재**한다.
6. FE blob(엑셀·지급조서 등)은 `POST /api/admin/logs/file-access/client`로 적재한다 — 계약: [client-file-access-log-backend-handoff.md](./client-file-access-log-backend-handoff.md).

## Out of scope / 금지

- `POST /api/admin/logs/file-access`(**GET과 동일 path**) 또는 `POST /api/admin/logs/privacy-access` 를 CMS용으로 만들지 마라.
- 클라이언트 발급 문서용 write는 **`POST /api/admin/logs/file-access/client`만** 허용한다(위 핸드오프).
- 버그/이슈 **상세 화면·상태 PATCH를 CMS에 요구하지 마라**. 기획은 행 클릭 액션 없음. 기존 `GET/PATCH /system-issues/{issueId}` 는 삭제하지 말고 그대로 둬라.
- `GET /api/admin/logs/mail-sends` 만들지 마라 (기획 보류).
- `/api/files/access-logs` 와 로그 관리 화면을 섞지 마라.
- 대시보드 `log-alerts` 를 이 작업에 넣지 마라.
- 프론트 엑셀 파일명·컬럼 라벨을 바꾸라고 하지 마라. 그건 FE 일이다.
- 한글 라벨을 임의 enum으로 바꾸지 마라.

## 공통 계약

Base: `/api/admin/logs/...`  
Auth: Bearer 관리자 JWT  
권한: OpenAPI에 **`LOG_READ`** (목록 GET·export) 를 명시하라. 지금 본문의 「별도 세부 권한 없음」과 불일치한다. `LOG_WRITE`는 상세 PATCH 전용.  
성공 래퍼: `{ success, data }` 가 있으면 FE가 `data`를 한 번 언랩한다. `data` 안에 Page가 있으면 된다.

목록 응답 **필수 형태** (최상위 배열 금지):

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

query 공통:

- `page`: 0-base, 기본 0
- `size`: 기본 20, 최대 100. 생략 시 20건만.
- `from` / `to`: `YYYY-MM-DD`. 해당 일 00:00:00 ~ 23:59:59.999 (서버 TZ, 문서에 TZ를 적어라).

OpenAPI에서 목록 4종의 **required `params` object 가방을 제거**하라. 필터는 아래 플랫 키만 property로 남겨라.

정렬: 각 화면의 일시 컬럼 **내림차순**. FE는 서버 결과를 신뢰하고 클라에서는 정렬만 한 번 더 한다.

---

## 1. 회원 로그인 이력 — P0

기획: CMS **관리자** 로그인 이력. 검색 조건 없으면 「전체」= **최근 1개월 전체**. 1개월 후 파기.

- `GET /api/admin/logs/member-logins`
- query: `adminName?`, `loginId?`, `from?`, `to?`, `page`, `size`
- 부분 검색 (contains, trim)
- `from` 미지정 시 서버가 cutoff(오늘-1개월)을 적용하라. `from`이 cutoff보다 이전이면 cutoff로 clamp.
- 1개월보다 오래된 행은 **조회에 안 나오고**, 가능하면 DB에서 파기/아카이브.
- 적재: 관리자 로그인 성공 시 서버가 행을 남긴다.

200 item:

| 필드 | 타입 | 화면 |
|---|---|---|
| id | string | rowKey |
| adminName | string | 관리자명 |
| loginId | string | 아이디 (이메일 가능) |
| loggedAt | date-time | 로그인 일시 |
| ipAddress | string | IP. **마스킹 없음** |

DoD:

```
GET /api/admin/logs/member-logins?page=0&size=20
GET /api/admin/logs/member-logins?adminName=홍길동&loginId=a%40b.com&from=2026-08-01&to=2026-08-26&page=0&size=20
```

1개월보다 오래된 `from`을 보내도 cutoff 이전 행이 없어야 한다. IP에 `xxx` 마스킹이 있으면 안 된다.

---

## 2. 파일 다운로드 이력 — P0 적재 + 목록

기획 컬럼: No, 다운로드 파일명, 사용자, 다운로드 일시, IP. 행 클릭 없음.

- `GET /api/admin/logs/file-access`
- query: `fileName?`, `userName?`, `from?`, `to?`, `page`, `size`

200 item (`DownloadLogFrontendResponse`):

| 필드 | 화면 |
|---|---|
| id | rowKey |
| fileName | 다운로드 파일명 |
| userName | 사용자 |
| downloadedAt | 다운로드 일시 |
| ipAddress | IP |
| userId | 매핑만, 컬럼 없음 |

**적재 (핵심):** CMS 목록은 POST하지 않는다. 실제 파일 다운로드/relay API가 성공하면 **서버가** `file-access` 행을 남겨라. 다운로드 API가 로그를 안 남기면 화면은 영원히 빈다.

DoD: 스테이징에서 파일 1개 다운로드 → 이 GET에 해당 파일명·사용자·일시·IP가 나온다.

---

## 3. 개인정보 조회 이력 — P0 감사 + targetName

기획 컬럼: No, 조회 대상(열람 대상자 명), 조회 목적, 조회자, 조회 일시, IP. 행 클릭 없음.

- `GET /api/admin/logs/privacy-access`
- query: `accessPurpose?`, `accessorName?`, `targetName?`, `from?`, `to?`, `page`, `size`

200 item (`PersonalInfoAccessLogFrontendResponse`):

| 필드 | 화면 |
|---|---|
| id | rowKey |
| **targetName** | 조회 대상. **비우지 마라.** 없으면 FE는 `-` |
| accessPurpose | 조회 목적 (unmask 사유) |
| accessorName | 조회자 |
| accessedAt | 조회 일시 |
| ipAddress | IP |
| accessItem, accessorId | 있어도 됨. 테이블 미표시 |

**적재:** 아래 unmask가 **성공하고 감사 저장에 성공해야만** 원문 응답. 감사 실패면 fail-closed (원문 주지 마라).

정규 경로 (OpenAPI):

- `POST /api/admin/users/{memberId}/privacy/unmask`
- 역할별: `.../instructor/privacy/unmask`, `.../individual/privacy/unmask`, `POST /api/admin/admin-accounts/{adminAccountId}/privacy/unmask`, `POST /api/admin/instructor-role-requests/{requestId}/privacy/unmask`

FE fallback: `POST /api/users/{memberId}/privacy/unmask` — **지원하지 말고**, 정규 `/api/admin/...` 만 남겨라. (FE가 admin 경로를 씀. fallback은 곧 제거.)

확인해서 답하라 (코드 주석 또는 README 한 줄):

- 마스킹된 상세 화면만 본 건은 남기는가? **권장: 남기지 않음. 원문 해제 성공만.**
- `targetName`은 열람 대상 회원/관리자 표시명인가?

DoD: unmask 1회 → privacy-access 목록에 `targetName`·`accessPurpose`·`accessorName`·`ipAddress`가 있는 행 1건.

---

## 4. 버그/이슈 이력 — 목록만

기획 컬럼: No, 에러 메시지, 사용자명, 발생일시. **「발생 화면」은 기획에서 삭제됨.** CMS는 더 이상 그 컬럼을 안 보여 준다. DTO `screenName`은 남겨도 된다.

- `GET /api/admin/logs/system-issues`
- query: `userName?`, `from?`, `to?`, `page`, `size`  
  (`status`, `severity`는 선택. CMS 필터 UI에는 없음)

200 item: `id` (int64), `errorMessage`, `userName`, `occurredAt`. `issueStatus`/`severity`/`screenName`은 있어도 화면 미표시.

상세 GET·PATCH는 유지하되 CMS는 호출하지 않는다. 목록 `id`와 path `issueId`는 **같은 int64**.

---

## 5. export — P1

지금은 FE가 **화면에 로드된 행만** xlsx로 내린다. 개인정보·IP가 포함된다.

만들어라:

```
GET /api/admin/logs/member-logins/export
GET /api/admin/logs/file-access/export
GET /api/admin/logs/privacy-access/export
GET /api/admin/logs/system-issues/export
```

- query는 각 목록 필터와 **동일** (`page`/`size` 없음 — 필터에 맞는 전 건, 또는 서버 상한과 `Content-Range`를 문서화)
- 감사로그 **필수**. 저장 실패 시 200 주지 마라 (fail-closed)
- `LOG_READ` + 개인정보 화면은 기존 privacy export 정책과 모순 없게
- 응답: xlsx 스트림 또는 기존 privacy-export job 패턴. 둘 중 레포에 있는 쪽을 재사용하라.

회원 로그인 엑셀 파일명은 FE가 `[JA Korea] CMS 어드민_회원 로그인 이력_YYMMDD` 로 받는다. `Content-Disposition` filename을 맞춰 주면 좋다.

---

## 6. local dummy seed — P0 (화면 검증)

`local` profile에서만. 라벨 예: `logs-fe-smoke-v1`. idempotent.

최소:

| 목록 | 건수 | 조건 |
|---|---|---|
| member-logins | ≥ 5 | 전부 최근 1개월, IP 원문, adminName/loginId 다양 |
| file-access | ≥ 5 | fileName 검색 가능한 파일명 1개 포함 |
| privacy-access | ≥ 3 | `targetName` 채워진 행 |
| system-issues | ≥ 3 | errorMessage·userName·occurredAt 필수. screenName은 있어도 됨 |

prod 시드/마이그레이션에 넣지 마라.

---

## 구현 순서

1. 로그 컨트롤러 4목록 + OpenAPI를 찾아라. `params` required 가방을 제거하고 플랫 키만 남겨라.
2. Page 매퍼가 `items` / `totalElements` / `hasNext` 를 쓰는지 확인하라. 배열 dump면 Page로 바꿔라.
3. member-logins 구현 + 1개월 윈도우 + 로그인 성공 시 적재.
4. 파일 다운로드 API → file-access 적재 훅.
5. unmask API → privacy-access 적재. `targetName` 매핑.
6. local 시드.
7. (P1) export 4종 + 감사 fail-closed.
8. OpenAPI 권한 문구를 `LOG_READ`로 맞추고 스펙을 FE에 다시 넘겨라.

## DoD 체크

- [ ] `GET .../member-logins?page=0&size=20` 200, mock 데이터 아님
- [ ] `from` 없는 조회가 1개월보다 오래된 행을 안 줌
- [ ] `GET .../file-access?fileName=...` 플랫 쿼리로 필터됨
- [ ] 파일 1건 다운로드 후 file-access에 행
- [ ] unmask 후 privacy-access에 `targetName` 있는 행
- [ ] `GET .../system-issues` 목록만으로 CMS 컬럼 충족 (에러 메시지, 사용자명, 발생일시)
- [ ] OpenAPI에 required `params` 가방 없음
- [ ] local 시드 idempotent, prod 미포함
- [ ] (P1) export 4종 + 감사 실패 시 비성공

끝나면 스테이징 예시 쿼리스트링과, 마스킹 조회를 감사에 남기는지 여부를 한 줄로 적어라.
