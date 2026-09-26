# Cursor prompt — 공개 채용공고 목록 검색 쿼리 `q` (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·쿼리명·매칭 규칙은 이 문서만 사용하라.

질문이 필요하면 스키마·기존 Spec·page 정책이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-careers-postings-list-search-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 Platform FE 기준)

Platform `/about/careers` 채용공고 목록은 이미 공개 API에 연결되어 있다.

| Method | Path | FE |
|--------|------|-----|
| GET | `/api/public/careers/postings` | 목록. **쿼리 없음**. RECRUITING·RESULT만. **비페이지** 전체 `items[]` |
| GET | `/api/public/careers/postings/{key}` | 상세 (`externalKey`) |
| GET | `/api/public/careers/guide` | 채용 안내 |

화면 검색창은 URL `?q=` 를 쓴다.  
**현재 공개 list에는 `q`가 없다.**  
그래서 Platform은 전체 목록을 받은 뒤 **제목만 클라에서** `filterCareerJobs` 로 거른다.

이번 작업은 **공개 list만** 확장한다. Admin 채용공고·가이드·상세는 바꾸지 마라.

관련 코드(참고만, 프론트 수정 금지):

- `CareerPostingPublicController#list` — 파라미터 없음
- 응답: `CareerPostingPublicListResponse { items: CareerPostingPublicItem[] }`
- `CareerPostingPublicItem`: `id`, `externalKey`, `status` (RECRUITING|RESULT|CLOSED), `title`, `publishedOn`
- 공개 list는 **CLOSED를 응답에 넣지 않는다** (기존 계약 유지)

---

## Goal

1. `GET /api/public/careers/postings` 가 optional 쿼리 **`q`** 로 **제목**을 DB에서 걸러 반환한다.
2. **비페이지 전체 목록** 계약은 유지한다 (`page`/`size` 추가 금지). `q` 있으면 **필터된 `items`만** 반환.
3. OpenAPI(로컬 `/v3/api-docs` 및 레포 스펙이 있다면)에 `q` 가 반영된다.
4. `q` 없거나 trim 후 빈 문자열이면 **기존 list와 동일**하다.

완료 조건:

```bash
# 전체(검색 없음) — RECRUITING·RESULT만
curl -sS 'http://localhost:8081/api/public/careers/postings'

# 제목 부분일치
curl -sS --get 'http://localhost:8081/api/public/careers/postings' \
  --data-urlencode 'q=매니저'
```

- 둘 다 **200**.
- `q` 있을 때 `items` 는 제목에 검색어가 포함된 **공개 가능**(RECRUITING·RESULT) 공고만.
- `q` 없는 호출의 `items` 내용·순서는 이 작업 전과 같아야 한다(회귀).

---

## Out of scope / 금지

- Admin 채용공고 CRUD·목록 쿼리 변경.
- 공개 상세 GET, guide API 변경.
- **페이지네이션(`page`/`size`) 도입**. 이번은 기존 non-page 계약 + `q` 필터만.
- 인증 요구. 공개 API는 **무토큰** 유지.
- Admin/Platform 프론트 파일 수정(이 프롬프트 범위 밖).
- 새 테이블·Flyway.
- `q` 대신 `title` / `keyword` 등 **다른 쿼리명**으로 바꾸기. FE는 **`q`** 를 보낸다.
- CLOSED 공고를 공개 list에 노출하기.

---

## 1. GET 공개 목록 — 추가 쿼리

Path: `GET /api/public/careers/postings`  
권한: **없음** (기존과 동일).

### 유지

- 응답 스키마 `CareerPostingPublicListResponse` / `CareerPostingPublicItem` 필드 변경 금지.
- 공개 상태: **RECRUITING · RESULT만** (CLOSED 제외).
- 정렬: 기존 공개 list 정렬 유지.

### 추가

| Query | 타입 | 의미 | 매칭 |
|-------|------|------|------|
| `q` | string, optional | 검색어 | **제목** 부분일치, **case-insensitive**. trim 후 빈 문자열·미전달이면 무시 |

매칭 구현:

- Admin/공지와 동일하게 `containsPattern(q)` 재사용(길이 상한·escape `%` `_` `\` 동일)이 있으면 그걸 쓴다.
- Spec 예: `lower(title) like pattern`.
- 본문(HTML content) 검색은 **하지 마라**. Platform 클라 필터도 제목만이다.

### 응답 (변경 금지)

| 필드 | 비고 |
|------|------|
| `items[]` | `id`, `externalKey`, `status`, `title`, `publishedOn` — **q 적용 후** 전체(비페이지) |

---

## 2. 구현 위치 (가이드)

| 위치 | 할 일 |
|------|--------|
| `CareerPostingPublicController#list` | `@RequestParam(required = false) String q` 추가 → service에 전달 |
| Public list service | `q` 받아 title like. `q` null/blank면 기존과 동일 |
| OpenAPI | `/v3/api-docs` 에 `q` 노출 |

---

## 3. 검증 체크리스트

- [ ] `GET .../postings` — 200, `q` 추가 전과 동일(RECRUITING·RESULT만, 정렬 동일)
- [ ] `GET .../postings?q=<제목에_있는_단어>` — 해당 건만
- [ ] `q=%20` 또는 `q=` — 검색 미적용과 동일
- [ ] 대소문자 다른 `q` 도 매칭
- [ ] `%` `_` 포함 `q` — escape
- [ ] CLOSED 공고는 `q` 로도 안 나옴
- [ ] `GET .../postings/{key}` · guide — 회귀 없음
- [ ] `/v3/api-docs` 에 `q` 존재
- [ ] 응답에 `page`/`size`/`totalCount` 를 **새로 넣지 않음**

---

## 4. FE 후속 (백엔드 에이전트는 하지 말 것)

백엔드 배포·검증 후 Platform에서:

- `fetchPublicCareerPostings({ q })` 로 `q` 전달
- `filterCareerJobs` 의 제목 클라 필터 제거(또는 `q` 없을 때만 fallback)
- queryKey에 `q` 포함

이 프롬프트 실행 중에는 **프론트를 고치지 마라.**

---

## Done when

1. 공개 list 에 `q` 가 있고, 제목 부분일치 + 기존 공개 상태·정렬·비페이지 계약이 맞다.  
2. OpenAPI에 `q` 가 보인다.  
3. Admin·공개 상세·guide는 회귀 없다.  
4. 프론트 레포는 손대지 않았다.
