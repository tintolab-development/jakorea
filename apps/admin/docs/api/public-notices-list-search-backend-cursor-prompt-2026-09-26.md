# Cursor prompt — 공개 공지 목록 검색 쿼리 `q` (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·쿼리명·매칭 규칙은 이 문서만 사용하라.

질문이 필요하면 스키마·기존 Spec·page 정책이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-notices-list-search-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 Platform FE 기준)

Platform `/notices` 목록·상세는 이미 공개 API에 연결되어 있다.

| Method | Path | FE |
|--------|------|-----|
| GET | `/api/public/ja-korea/notices` | 목록. 지금은 **`page` `size`만** 보냄 |
| GET | `/api/public/ja-korea/notices/{id}` | 상세. 조회수 증가 |
| HEAD | `/api/public/ja-korea/notices/{id}` | 공개 가능 여부 |

화면 검색창 placeholder는 **「제목, 내용으로 검색해 보세요」** 이다.  
URL에는 `?q=` 를 쓴다.

**현재 공개 list에는 `q`(또는 title/keyword) 쿼리가 없다.**  
그래서 Platform은 검색 시 preview(최대 100건)를 받아 **제목만 클라에서** 거른다.  
본문 검색·서버 페이지네이션·전체 건수 반영이 되지 않는다.

Admin 목록 `GET /api/admin/ja-korea/notices` 는 이미 `title`(부분일치) 등이 있다.  
이번 작업은 **공개 list만** 확장한다. Admin search·상세·HEAD는 바꾸지 마라.

관련 코드(참고만, 프론트 수정 금지):

- `JaNoticePublicController` — `list(page, size)` 만
- `JaNoticeService.publicList(int page, int size)` — published + publishAt≤now, 핀·게시일 desc
- Admin 쪽 부분일치: `JaKoreaSearchSupport.containsPattern` + `noticeSpec` 의 title `like`

---

## Goal

1. `GET /api/public/ja-korea/notices` 가 optional 쿼리 **`q`** 로 **제목·본문**을 DB에서 걸러 반환한다.
2. `page` / `size` / 정렬 / 공개 조건은 기존과 동일하다.
3. OpenAPI(로컬 `/v3/api-docs` 및 레포 스펙이 있다면)에 `q` 가 반영된다.
4. `q` 없거나 trim 후 빈 문자열이면 **기존 list와 동일**하다.

완료 조건:

```bash
# 전체(검색 없음)
curl -sS 'http://localhost:8081/api/public/ja-korea/notices?page=0&size=10'

# 제목·본문 부분일치
curl -sS --get 'http://localhost:8081/api/public/ja-korea/notices' \
  --data-urlencode 'q=페스티벌' \
  --data-urlencode 'page=0' \
  --data-urlencode 'size=10'
```

- 둘 다 **200**.
- `q` 있을 때 `items` 는 제목 **또는** 본문에 검색어가 포함된 **공개 가능** 공지만.
- `totalCount` / `totalPages` 는 **필터 후** 기준이다.
- `q` 없는 호출의 건수·정렬은 이 작업 전과 같아야 한다(회귀).

---

## Out of scope / 금지

- Admin `GET /api/admin/ja-korea/notices` 쿼리·스키마 변경.
- 공개 상세 GET/HEAD, 조회수, Cache-Control 변경.
- 작성자·게시일 범위 등 공개 list에 Admin 필터 전부 이식.
- 인증 요구. 공개 API는 **무토큰** 유지.
- Admin/Platform 프론트 파일 수정(이 프롬프트 범위 밖).
- 새 테이블·Flyway. 기존 `ja_notice` 컬럼만 사용.
- `q` 대신 `title` / `keyword` 등 **다른 쿼리명**으로 바꾸기. FE는 **`q`** 를 보낸다.

---

## 1. GET 공개 목록 — 추가 쿼리

Path: `GET /api/public/ja-korea/notices`  
권한: **없음** (기존과 동일).

### 유지

| Query | 타입 | 비고 |
|-------|------|------|
| `page` | int, default `0` | 0-base. 기존 `JaKoreaSearchSupport.validatePage` / OffsetPagePolicy |
| `size` | int, default `20` | 상한은 기존 page 정책과 동일 |

### 추가

| Query | 타입 | 의미 | 매칭 |
|-------|------|------|------|
| `q` | string, optional | 검색어 | **제목 OR 본문** 부분일치, **case-insensitive**. trim 후 빈 문자열·미전달이면 무시 |

매칭 구현:

- `JaKoreaSearchSupport.containsPattern(q)` 재사용(길이 상한·escape `%` `_` `\` 동일).
- Spec 예: `lower(title) like pattern OR lower(body) like pattern` (escape char `\` — Admin title like와 동일).
- HTML 본문이라도 **저장된 `body` 문자열** 기준 like면 충분하다. HTML strip·전문검색 엔진은 하지 마라.

### 공개 조건 (변경 금지)

기존 `publicList` 와 동일하게 **AND**:

1. `published = true`
2. `publishAt <= now` (서버 clock)

검색은 위 두 조건 **위에** `q` 조건을 얹는다. 비공개·예약 게시 공지는 절대 나오지 않는다.

### 정렬 (변경 금지)

1. `pinned` desc  
2. `publishAt` desc  
3. `id` desc  

### 응답 (변경 금지)

기존 `PageResponse<PublicNoticeListItem>`:

| 필드 | 비고 |
|------|------|
| `items[]` | `id`, `pinned`, `publishAt`, `title`, `authorName`, `viewCount` |
| `totalCount` | **q 적용 후** |
| `page` / `size` / `totalPages` | 동일 |

`items` 에 `body` 를 넣지 마라(목록 계약 유지).

---

## 2. 구현 위치 (가이드)

레포 안 이름은 다를 수 있으나 현재 구조는 대략:

| 위치 | 할 일 |
|------|--------|
| `JaNoticePublicController#list` | `@RequestParam(required = false) String q` 추가 → `service.publicList(q, page, size)` |
| `JaNoticeService#publicList` | `q` 받아 Spec에 title/body OR like. `q` null/blank면 기존 Spec만 |
| OpenAPI | `/v3/api-docs` 에 `q` 노출. 커밋하는 openapi 파일이 있으면 같이 갱신 |

시그니처를 `publicList(String q, int page, int size)` 로 바꾸면, **내부 호출부**가 있으면 전부 맞춘다. 오버로드로 남겨도 된다.

---

## 3. 검증 체크리스트

시드·실데이터에 공개 공지가 있다고 가정한다. 없으면 기존 local notice seed를 실행한 뒤 검증하라(시드 내용은 이 문서 범위가 아님).

- [ ] `GET .../notices?page=0&size=10` — 200, `q` 추가 전과 동일 성격(공개만, 정렬 동일)
- [ ] `GET .../notices?q=<제목에만_있는_단어>&page=0&size=10` — 해당 건만, `totalCount` 일치
- [ ] `GET .../notices?q=<본문에만_있는_단어>&page=0&size=10` — 제목에 없어도 본문으로 매칭
- [ ] `GET .../notices?q=%20` 또는 `q=` — 검색 미적용과 동일(전체 공개 목록)
- [ ] 대소문자 다른 `q` 도 매칭
- [ ] `%` `_` 포함 `q` — escape 되어 literal 검색(Admin title 검색과 동일 정책)
- [ ] 비공개·미래 `publishAt` 공지는 `q` 로도 안 나옴
- [ ] `GET .../notices/{id}` · HEAD — 회귀 없음
- [ ] `/v3/api-docs` 의 해당 path parameters 에 `q` 존재

---

## 4. FE 후속 (백엔드 에이전트는 하지 말 것)

백엔드 배포·검증 후 Platform에서:

- `fetchPublicNotices({ q, page, size })` 로 `q` 전달
- 검색 시 preview 클라 필터 제거 → **서버 페이지네이션** 사용
- queryKey에 `q` 포함

이 프롬프트 실행 중에는 **프론트를 고치지 마라.**

---

## Done when

1. 공개 list 에 `q` 가 있고, 제목·본문 부분일치 + 기존 공개 조건·정렬이 맞다.  
2. `totalCount`/`totalPages` 가 검색 결과를 반영한다.  
3. OpenAPI에 `q` 가 보인다.  
4. Admin 목록·공개 상세는 회귀 없다.  
5. 프론트 레포는 손대지 않았다.
