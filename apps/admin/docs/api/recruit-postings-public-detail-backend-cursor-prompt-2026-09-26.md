# Cursor prompt — 채용공고 공개 상세 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·필드·enum은 이 문서만 사용하라.

질문이 필요하면 스키마·권한·기존 Flyway가 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/recruit-postings-public-detail-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 FE 기준)

Platform 채용공고 상세(`/about/careers/:postingId`)가 공개 상세를 호출한다.

이미 있는 계약:

| Method | Path | 상태 |
|--------|------|------|
| GET | `/api/public/careers/postings` | **구현됨**. `is_public=true` 이고 status `RECRUITING`\|`RESULT` 만. item은 `id, externalKey, status, title, publishedOn` |
| GET | `/api/admin/careers/postings/{id}` | Admin 상세. `body`, `attachment`, `recruitStart`, `recruitEnd`, `publishedOn`, `authorName` |

갭:

공개 **단건**이 없다. 목록 item에 본문·첨부·모집기간을 넣으면 목록이 무거워지므로 **별도 GET**으로 둔다.

Platform 목록 id는 `externalKey`가 있으면 그 값, 없으면 숫자 `id` 문자열이다. 상세 path key도 같다.

---

## Goal

1. 무토큰 `GET /api/public/careers/postings/{key}` 가 공개 상세를 반환한다.
2. 기존 `GET /api/public/careers/postings` item 스키마는 **그대로**다. body·첨부·모집기간·조회수를 목록에 넣지 않는다.
3. OpenAPI(`/v3/api-docs`)에 path·스키마가 반영된다.

완료 조건 (로컬 `8081`, 토큰 없음):

```bash
# 목록에 있는 공개 공고. key는 externalKey 또는 숫자 id
curl -sS http://localhost:8081/api/public/careers/postings/job-1
# → 200, body 포함. status는 RECRUITING 또는 RESULT

curl -sS http://localhost:8081/api/public/careers/postings/{numericId}
# → 같은 행이면 200, 위와 동일 본문

# 없음 · CLOSED · is_public=false
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8081/api/public/careers/postings/does-not-exist
# → 404

# 목록 회귀
curl -sS http://localhost:8081/api/public/careers/postings
# → 기존 item 필드만. body·attachment·recruitStart·recruitEnd·viewCount 없음
```

---

## Out of scope / 금지

- 공개 목록 item에 body·첨부·author·recruit·viewCount 추가.
- Admin create/update/detail/visibility/delete 변경.
- 다중 첨부. **첨부 0 또는 1건**.
- `status` enum 추가.
- Platform·Admin 프론트 수정.
- 이전글/다음글을 응답에 넣기. FE가 공개 목록 순서로 계산한다.

---

## 계약

### `GET /api/public/careers/postings/{key}`

- 인증 없음. `skipAuth`.
- `{key}`: `externalKey`와 일치하거나, 숫자면 `id`와 일치.
- 200 조건: 행이 있고 `is_public=true` 이고 status가 `RECRUITING` 또는 `RESULT`.
- 그 외(없음, CLOSED, 비공개)는 **404**. 본문을 내려주지 않는다.

응답 스키마 `CareerPostingPublicDetail` (envelope는 기존 공개 API와 동일):

| field | type | 비고 |
|-------|------|------|
| `id` | int64 | |
| `externalKey` | string | |
| `status` | `RECRUITING` \| `RESULT` | CLOSED는 404 |
| `title` | string | |
| `publishedOn` | date `YYYY-MM-DD` | 필수 |
| `publishedAt` | date-time | 선택. 있으면 FE가 `2026년 01월 15일 오후 3:00` 으로 표시. 없으면 날짜만 |
| `recruitStart` | date | 선택. 시작·종료가 둘 다 있을 때만 FE가 모집 기간을 표시 |
| `recruitEnd` | date | 선택 |
| `body` | string | HTML. 없으면 `""` |
| `attachment` | AssetResponse \| null | 0 또는 1. purpose `CAREERS_POSTING_ATTACHMENT`. `originalName`, `publicUrl`, `assetId` |
| `viewCount` | int32 | 선택. 컬럼이 없으면 **필드를 생략**. `0`을 억지로 넣지 않는다. FE는 숫자가 있을 때만 조회수를 표시 |

`authorName`, `isPublic`, `version` 은 공개 상세에 넣지 않는다.

조회수 컬럼이 공지와 같이 이미 있거나 이번 마이그레이션에서 추가할 수 있으면, 이 GET에서 1 증가하고 `viewCount`를 포함한다. 스키마·마이그레이션이 막히면 필드를 생략하고 200은 그대로 둔다.

---

## 검증

1. 공개 `RECRUITING` 행을 externalKey와 숫자 id 둘 다로 200.
2. 같은 행의 `RESULT` 도 200. `recruitStart`/`recruitEnd` 가 null이면 키를 생략하거나 null.
3. `CLOSED`·비공개·없는 key는 404.
4. 목록 GET item에 상세 전용 필드가 없다.
5. OpenAPI에 `GET /api/public/careers/postings/{key}` 와 `CareerPostingPublicDetail` 이 있다.
