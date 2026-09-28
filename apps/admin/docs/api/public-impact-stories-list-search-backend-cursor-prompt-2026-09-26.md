# Cursor prompt — 공개 임팩트 스토리 목록 검색 쿼리 `q` (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·쿼리명·매칭 규칙은 이 문서만 사용하라.

질문이 필요하면 스키마·기존 Spec·page 정책이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-impact-stories-list-search-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 Platform FE 기준)

Platform `/impact` 목록·상세는 이미 공개 API에 연결되어 있다.

| Method | Path | FE |
|--------|------|-----|
| GET | `/api/public/impact-story/stories` | 목록. 지금은 **`categoryId` `page` `size`만** 서버가 받음 |
| GET | `/api/public/impact-story/stories/{id}` | 상세 |
| GET | `/api/public/impact-story/categories` | 카테고리 |

화면 검색창은 URL `?q=` 를 쓴다.  
FE 클라이언트는 `q` 를 보내려 하지만 **공개 list OpenAPI에 `q`가 없어** 검색 시 preview(최대 100건)를 받아 **제목·요약만 클라에서** 거른다.  
본문 검색·서버 페이지네이션·전체 건수 반영이 되지 않는다.

Admin 목록 `GET /api/admin/impact-story/stories` 는 이미 `title` 등 검색이 있을 수 있다.  
이번 작업은 **공개 list만** 확장한다. Admin search·상세·카테고리는 바꾸지 마라.

관련 코드(참고만, 프론트 수정 금지):

- `ImpactStoryPublicController` — `stories(categoryId, page, size)` 만
- Admin 쪽 부분일치 패턴이 있으면 재사용(`containsPattern` / Spec `like`)

---

## Goal

1. `GET /api/public/impact-story/stories` 가 optional 쿼리 **`q`** 로 **제목**(필요 시 본문)을 DB에서 걸러 반환한다.
2. `categoryId` / `page` / `size` / 정렬 / 공개 조건은 기존과 동일하다.
3. OpenAPI(로컬 `/v3/api-docs` 및 레포 스펙이 있다면)에 `q` 가 반영된다.
4. `q` 없거나 trim 후 빈 문자열이면 **기존 list와 동일**하다.

완료 조건:

```bash
# 전체(검색 없음)
curl -sS 'http://localhost:8081/api/public/impact-story/stories?page=0&size=10'

# 제목(·본문) 부분일치
curl -sS --get 'http://localhost:8081/api/public/impact-story/stories' \
  --data-urlencode 'q=캠프' \
  --data-urlencode 'page=0' \
  --data-urlencode 'size=10'

# 카테고리 + 검색
curl -sS --get 'http://localhost:8081/api/public/impact-story/stories' \
  --data-urlencode 'categoryId=1' \
  --data-urlencode 'q=캠프' \
  --data-urlencode 'page=0' \
  --data-urlencode 'size=10'
```

- 모두 **200**.
- `q` 있을 때 `items` 는 제목(및 구현 시 본문)에 검색어가 포함된 **공개 가능** 스토리만.
- `totalCount` / `totalPages` 는 **필터 후** 기준이다.
- `q` 없는 호출의 건수·정렬은 이 작업 전과 같아야 한다(회귀).

---

## Out of scope / 금지

- Admin `GET /api/admin/impact-story/stories` 쿼리·스키마 변경.
- 공개 상세 GET, 카테고리 API, Cache-Control 변경.
- 인증 요구. 공개 API는 **무토큰** 유지.
- Admin/Platform 프론트 파일 수정(이 프롬프트 범위 밖).
- 새 테이블·Flyway. 기존 스토리 컬럼만 사용.
- `q` 대신 `title` / `keyword` 등 **다른 쿼리명**으로 바꾸기. FE는 **`q`** 를 보낸다.
- 페이지네이션을 없애거나 non-page 전체 목록으로 바꾸기.

---

## 1. GET 공개 목록 — 추가 쿼리

Path: `GET /api/public/impact-story/stories`  
권한: **없음** (기존과 동일).

### 유지

| Query | 타입 | 비고 |
|-------|------|------|
| `categoryId` | long, optional | 기존과 동일. 없으면 전체 카테고리 |
| `page` | int, default `0` | 0-base. 기존 page 정책 |
| `size` | int, default `20` | 상한은 기존 page 정책과 동일 |

### 추가

| Query | 타입 | 의미 | 매칭 |
|-------|------|------|------|
| `q` | string, optional | 검색어 | **제목** 부분일치, **case-insensitive**. 본문 컬럼이 목록 Spec에 쓰기 쉬우면 **제목 OR 본문**도 허용. trim 후 빈 문자열·미전달이면 무시 |

매칭 구현:

- Admin/공지와 동일하게 `containsPattern(q)` 재사용(길이 상한·escape `%` `_` `\` 동일)이 있으면 그걸 쓴다.
- Spec 예: `lower(title) like pattern` (본문 포함 시 `OR lower(body) like pattern`).
- HTML 본문이라도 **저장된 문자열** 기준 like면 충분하다. HTML strip·전문검색 엔진은 하지 마라.

### 공개 조건 (변경 금지)

기존 공개 list 와 동일하게 **AND** (published / 노출 가능 조건 등).  
검색은 위 조건 **위에** `q` 조건을 얹는다.

### 정렬 (변경 금지)

기존 공개 list 정렬을 유지한다.

### 응답 (변경 금지)

기존 `PageResponse<PublicStoryListItem>`:

| 필드 | 비고 |
|------|------|
| `items[]` | 기존 목록 필드 유지 |
| `totalCount` | **q 적용 후** |
| `page` / `size` / `totalPages` | 동일 |

---

## 2. 구현 위치 (가이드)

레포 안 이름은 다를 수 있으나 현재 구조는 대략:

| 위치 | 할 일 |
|------|--------|
| `ImpactStoryPublicController#stories` | `@RequestParam(required = false) String q` 추가 → service에 전달 |
| Public list service | `q` 받아 Spec에 title(·body) like. `q` null/blank면 기존 Spec만 |
| OpenAPI | `/v3/api-docs` 에 `q` 노출. 커밋하는 openapi 파일이 있으면 같이 갱신 |

---

## 3. 검증 체크리스트

시드·실데이터에 공개 스토리가 있다고 가정한다.

- [ ] `GET .../stories?page=0&size=10` — 200, `q` 추가 전과 동일 성격
- [ ] `GET .../stories?q=<제목에만_있는_단어>&page=0&size=10` — 해당 건만, `totalCount` 일치
- [ ] (본문 매칭 구현 시) `GET .../stories?q=<본문에만_있는_단어>&page=0&size=10` — 제목에 없어도 매칭
- [ ] `categoryId` + `q` 동시 — 둘 다 AND
- [ ] `q=%20` 또는 `q=` — 검색 미적용과 동일
- [ ] 대소문자 다른 `q` 도 매칭
- [ ] `%` `_` 포함 `q` — escape 되어 literal 검색
- [ ] 비공개 스토리는 `q` 로도 안 나옴
- [ ] `GET .../stories/{id}` · categories — 회귀 없음
- [ ] `/v3/api-docs` 의 해당 path parameters 에 `q` 존재

---

## 4. FE 후속 (백엔드 에이전트는 하지 말 것)

백엔드 배포·검증 후 Platform에서:

- `fetchPublicImpactStories({ q, categoryId, page, size })` 로 `q` 전달(이미 보내는 코드가 있으면 유지)
- 검색 시 preview 클라 필터 제거 → **서버 페이지네이션** 사용 (`useImpactStoriesList` 의 `q` 분기)
- queryKey에 `q` 포함(이미 있으면 유지)

이 프롬프트 실행 중에는 **프론트를 고치지 마라.**

---

## Done when

1. 공개 list 에 `q` 가 있고, 제목(·본문) 부분일치 + 기존 공개 조건·정렬·`categoryId`/`page`/`size` 가 맞다.  
2. `totalCount`/`totalPages` 가 검색 결과를 반영한다.  
3. OpenAPI에 `q` 가 보인다.  
4. Admin 목록·공개 상세는 회귀 없다.  
5. 프론트 레포는 손대지 않았다.
