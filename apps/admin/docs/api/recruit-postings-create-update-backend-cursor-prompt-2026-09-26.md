# Cursor prompt — 채용공고 Admin 등록·수정·상세 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·enum은 이 문서만 사용하라.

질문이 필요하면 스키마·권한·기존 Flyway·MinIO 정책이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/recruit-postings-create-update-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 FE 기준)

이미 동작하는 계약:

| Method | Path | 상태 |
|--------|------|------|
| GET | `/api/admin/careers/postings` | **구현됨**. Admin 목록. item에 body·첨부 없음 |
| PATCH | `/api/admin/careers/postings/{id}/visibility` | **구현됨**. body `{ isPublic, version }` |
| DELETE | `/api/admin/careers/postings` | **구현됨**. body **숫자 id 배열** (1~100) |
| GET | `/api/public/careers/postings` | **구현됨**. `is_public=true` 이고 status `RECRUITING`\|`RESULT` 만. item은 `id, externalKey, status, title, publishedOn` |

갭:

Admin `/ja-korea/recruit/postings` 등록·수정 모달과 상세 페이지가 있다.  
OpenAPI에 **POST / PUT / GET `{id}` 가 없고**, `career_posting` 테이블에 **본문·첨부 컬럼이 없다**.  
그래서 Admin FE remote 모드에서 등록·수정은 `채용공고 등록·수정 API가 아직 없습니다.` 로 막고, 상세는 목록 행만 재사용한다(본문·첨부 비어 있음).

참고 구현(패턴만 재사용, path·purpose 복사 금지):

| 용도 | JA 공지 (기존) |
|------|----------------|
| create | `POST /api/admin/ja-korea/notices` |
| update | `PUT /api/admin/ja-korea/notices/{id}` |
| detail | `GET /api/admin/ja-korea/notices/{id}` |
| body 필드 | `body` (HTML/텍스트, max 100000) |
| 첨부 | optional `attachmentAssetId` + AssetResponse |

공개 목록 스키마(`CareerPostingPublicItem`)는 **바꾸지 마라**. Platform은 목록만 쓴다.

---

## Goal

1. Admin이 채용공고를 **등록·수정**할 수 있다 (본문·모집기간·게시일·공개·상태·선택 첨부 1건).
2. Admin이 **상세 GET**으로 본문·첨부를 받을 수 있다.
3. 기존 list / visibility / delete / 공개 list 는 회귀 없이 유지한다.
4. OpenAPI(`/v3/api-docs`)에 새 path·필드가 반영된다.

완료 조건 (로컬 `8081`, Admin JWT, `EDIT`+`PUBLISH` 또는 기존 postings write와 동일 권한):

```bash
# create
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  http://localhost:8081/api/admin/careers/postings \
  -d '{"title":"테스트 공고","body":"<p>본문</p>","isPublic":true,"status":"RECRUITING","publishedOn":"2026-09-26","recruitStart":"2026-09-26","recruitEnd":"2026-10-26","authorName":"홍길동"}'
# → 201, AdminDetail(또는 AdminItem + body) 반환, id·version·externalKey 존재

# detail
curl -sS -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/api/admin/careers/postings/{id}
# → 200, body 포함

# update (version 필수)
curl -sS -X PUT -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  http://localhost:8081/api/admin/careers/postings/{id} \
  -d '{"title":"테스트 공고 수정","body":"<p>수정</p>","isPublic":true,"status":"RESULT","publishedOn":"2026-09-26","recruitStart":"2026-09-26","recruitEnd":"2026-10-26","authorName":"홍길동","version":0}'
# → 200, version 증가

# 공개 목록 회귀
curl -sS http://localhost:8081/api/public/careers/postings
# → 기존과 동일 스키마. CLOSED·비공개는 없음
```

---

## Out of scope / 금지

- 공개 `GET /api/public/careers/postings` item에 body·첨부·author·recruit 추가.
- Platform 상세 공고 API 신설(이번 범위 아님).
- Admin 목록 GET에 서버 필터 query 추가(이번 범위 아님. FE가 클라이언트 필터).
- visibility PATCH·DELETE body 형태 변경.
- 다중 첨부. **첨부 0 또는 1건**만.
- Admin/Platform 프론트 수정.
- `status` enum 추가. 지금은 `RECRUITING` \| `RESULT` \| `CLOSED` 만.
- 시드 SQL 전면 재작성(본문 시드는 optional; 없어도 create로 검증 가능).

---

## 1. DB — Flyway

다음 마이그레이션을 **새 버전**으로 추가한다 (로컬에 V24 등이 있으면 충돌 없이 다음 번호).

`homepage.career_posting` 에 컬럼 추가:

| column | type | null | 비고 |
|--------|------|------|------|
| `body` | `TEXT` | YES | 기존 시드 행은 NULL 허용. create/update 요청은 필수 |
| `attachment_asset_id` | `BIGINT` | YES | FK → `homepage.file_asset(id)` ON DELETE SET NULL |

제약:

- `attachment_asset_id` 가 NOT NULL이면 purpose가 **`CAREERS_POSTING_ATTACHMENT`** 인지 강제 (기존 careers cover trigger 패턴 재사용).
- `AssetPurpose` enum에 `CAREERS_POSTING_ATTACHMENT` 추가.  
  허용 MIME (공지 첨부와 동일 계열로):

  - `image/jpeg`, `image/png`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

  최대 크기: **20MB** (공지와 맞추되, 기존 공지 정책이 다르면 공지를 따른다).

Entity `CareerPosting`에 getter + create/update 메서드(또는 패키지 생성자)를 추가한다.  
visibility 전용 `changeVisibility`는 유지.

---

## 2. Admin 첨부 — prepare / confirm

권한: Admin JWT, 기존 careers edit와 동일 (`HAS_EDIT_AND_PUBLISH` 또는 NOTICE 첨부 Admin path와 동일 수준).

공지 Admin 첨부 upload path 패턴을 따르되 **careers 전용 path·purpose**를 쓴다.

### Prepare

`POST /api/admin/careers/postings/attachments/upload-requests`  
응답: **201**

Request:

| 필드 | 필수 | 비고 |
|------|------|------|
| `originalName` | yes | max 255 |
| `contentType` | yes | max 100 |
| `sizeBytes` | no | int64 |

Response: 기존 Asset prepare와 **동일 형태** (`assetId`, `uploadUrl`, `headers` 등 — 공지/재능기부 prepare 응답을 복사하지 말고 **이 레포의 공통 Asset prepare 응답**을 재사용).

purpose = `CAREERS_POSTING_ATTACHMENT`.

### Confirm

`POST /api/admin/careers/postings/attachments/{assetId}/confirm`  
응답: **200**  
공지 Admin confirm과 동일 계약.

클라이언트가 MinIO에 PUT한 뒤에만 confirm한다.

---

## 3. Create

`POST /api/admin/careers/postings`  
권한: `HAS_EDIT_AND_PUBLISH`  
응답: **201** + Admin **Detail** (아래 §5)

Request (`CareerPostingCreateRequest`):

| 필드 | 필수 | 타입 | 비고 |
|------|------|------|------|
| `title` | yes | string | trim, 1~300 |
| `body` | yes | string | trim 후 비어 있으면 400. max 100000 |
| `isPublic` | yes | boolean | |
| `status` | yes | enum | create는 **`RECRUITING` \| `RESULT`만**. `CLOSED`면 400 |
| `publishedOn` | yes | `YYYY-MM-DD` | |
| `recruitStart` | yes | `YYYY-MM-DD` | |
| `recruitEnd` | yes | `YYYY-MM-DD` | `recruitEnd >= recruitStart` |
| `authorName` | yes | string | trim, 1~200. FE가 `홍길동` 등 보냄. 서버가 로그인 이름으로 덮어쓰지 말 것 |
| `attachmentAssetId` | no | long | 있으면 purpose·confirm 완료된 asset이어야 함 |

서버 책임:

1. `external_key` 자동 생성. 충돌 없는 값 (예: `job-{uuid short}` 또는 `posting-{id}` 예약 후 flush). **클라이언트가 externalKey를 보내지 않는다.**
2. `created_at` = now, `updated_at` = now, `created_by`/`updated_by` = principal.
3. `version` = 0.
4. audit: `CREATE` / `CAREER_POSTING`.

---

## 4. Update

`PUT /api/admin/careers/postings/{id}`  
권한: `HAS_EDIT_AND_PUBLISH`  
응답: **200** + Admin Detail

Request (`CareerPostingUpdateRequest`): create와 동일 필드 +

| 필드 | 필수 | 비고 |
|------|------|------|
| `version` | yes | optimistic lock. 불일치 시 기존 VersionGuard 에러 |

Update의 `status`는 **`RECRUITING` \| `RESULT` \| `CLOSED`** 허용 (목록에 CLOSED 시드가 있음).

`attachmentAssetId`:

- 생략/null → 첨부 제거(컬럼 null).
- 값 있음 → 새 asset으로 교체(purpose 검증).

`external_key`는 변경하지 않는다.

audit: `UPDATE` / `CAREER_POSTING`.

---

## 5. Detail

`GET /api/admin/careers/postings/{id}`  
권한: `HAS_VIEW` (목록과 동일)  
응답: **200**

Response (`CareerPostingAdminDetail`) — 목록 `AdminItem` 확장:

| 필드 | 타입 | 비고 |
|------|------|------|
| (AdminItem 전 필드) | | `id, externalKey, status, title, publishedOn, isPublic, authorName, recruitStart, recruitEnd, createdAt, version` |
| `body` | string \| null | 시드 구행은 null 가능 |
| `attachment` | AssetResponse \| null | 없으면 null. 다운로드에 필요한 url·fileName·contentType 포함(공지 detail과 동일 형태) |
| `updatedAt` | Instant | |

없는 id → 기존 `CAREER_RESOURCE_NOT_FOUND`.

create/update 응답도 **이 Detail 스키마**를 반환한다 (목록 item에 body를 넣지 마라).

---

## 6. 목록 회귀

`GET /api/admin/careers/postings` 의 `CareerPostingAdminItem` **스키마를 바꾸지 마라**.  
body·attachment는 detail 전용.

공개 list 정렬·필터(`is_public` + RECRUITING/RESULT) 유지.

---

## 7. OpenAPI / 테스트

1. `/v3/api-docs`에 위 path·스키마 이름이 보인다.
2. 기존 careers 소스 계약 테스트(`CareersSourceContractTest` 등)가 있으면 create/update/detail·purpose를 추가하거나 갱신한다.
3. 통합 테스트 최소:

   - create → detail body 일치
   - update version mismatch → 409/기존 코드
   - create status=CLOSED → 400
   - attachment purpose 불일치 → 400
   - public list에 body 필드 없음

---

## 8. 권한·보안 요약

| Path | Auth |
|------|------|
| POST/PUT postings, attachment prepare/confirm | Admin + EDIT&PUBLISH |
| GET detail | Admin + VIEW |
| GET list / PATCH visibility / DELETE | 기존 유지 |
| GET public postings | 무토큰 (기존) |

첨부 download URL은 Admin detail의 `attachment`에만 노출. 공개 postings에는 넣지 않는다.

---

## 완료 후 한 줄

Admin FE가 Orval 재생성 후 `POST`/`PUT`/`GET {id}` 와 attachment prepare/confirm을 연결하면 등록·수정·상세 본문이 remote에서 동작한다.  
이 문서 범위에서는 **백엔드만** 구현한다.
