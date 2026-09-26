# Cursor prompt — 공개 투명경영 보고서 목록 검색 쿼리 `q` (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·쿼리명·매칭 규칙은 이 문서만 사용하라.

질문이 필요하면 스키마·기존 Spec·page 정책이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/public-transparency-reports-list-search-backend-cursor-prompt-2026-09-26.md`

---

## 배경 (2026-09-26 Platform FE 기준)

Platform 투명경영 연차/회계감사 보고서 목록용 **공개 API는 이미 존재**한다.  
다만 Platform 화면은 아직 mock + 클라 `filterReports` 를 쓰고 있고, URL에는 `?q=` 를 둔다.

| Method | Path | 비고 |
|--------|------|------|
| GET | `/api/public/ja-korea/transparency/reports/{type}` | 목록. 지금은 **`page` `size`만**. `type` = `ANNUAL` \| `AUDIT` |
| GET | `/api/public/ja-korea/transparency/reports/{id}/download` | 다운로드 |

**현재 공개 list에는 `q`가 없다.**  
서버 검색이 없으면 FE가 remote로 전환해도 제목 검색을 클라에서만 해야 한다.

Admin 목록 `GET /api/admin/ja-korea/transparency/reports/{type}` 는 별도.  
이번 작업은 **공개 list만** 확장한다. Admin·다운로드는 바꾸지 마라.

관련 코드(참고만, 프론트 수정 금지):

- `JaTransparencyPublicController` — `reports(type, page, size)` 만
- 응답: `PageResponse<PublicReportResponse>` (`id`, `reportType`, `title`, `thumbnailUrl`, `attachmentFileName`, `downloadUrl`, `downloadCount`, `createdAt`)

---

## Goal

1. `GET /api/public/ja-korea/transparency/reports/{type}` 가 optional 쿼리 **`q`** 로 **제목**을 DB에서 걸러 반환한다.
2. `type` / `page` / `size` / 정렬 / 공개 조건은 기존과 동일하다.
3. OpenAPI(로컬 `/v3/api-docs` 및 레포 스펙이 있다면)에 `q` 가 반영된다.
4. `q` 없거나 trim 후 빈 문자열이면 **기존 list와 동일**하다.

완료 조건:

```bash
# 전체(검색 없음)
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL?page=0&size=10'
curl -sS 'http://localhost:8081/api/public/ja-korea/transparency/reports/AUDIT?page=0&size=10'

# 제목 부분일치
curl -sS --get 'http://localhost:8081/api/public/ja-korea/transparency/reports/ANNUAL' \
  --data-urlencode 'q=2024' \
  --data-urlencode 'page=0' \
  --data-urlencode 'size=10'
```

- 모두 **200**.
- `q` 있을 때 `items` 는 해당 `type` 이고 제목에 검색어가 포함된 **공개 가능** 보고서만.
- `totalCount` / `totalPages` 는 **필터 후** 기준이다.
- `q` 없는 호출의 건수·정렬은 이 작업 전과 같아야 한다(회귀).

---

## Out of scope / 금지

- Admin `GET /api/admin/ja-korea/transparency/reports/{type}` 쿼리·스키마 변경.
- 공개 다운로드 URL·카운트 로직 변경.
- 인증 요구. 공개 API는 **무토큰** 유지.
- Admin/Platform 프론트 파일 수정(이 프롬프트 범위 밖). Platform mock→remote 전환도 **하지 마라**.
- 새 테이블·Flyway. 기존 보고서 컬럼만 사용.
- `q` 대신 `title` / `keyword` 등 **다른 쿼리명**으로 바꾸기. FE는 **`q`** 를 보낸다.
- `type` path enum (`ANNUAL`/`AUDIT`) 변경.

---

## 1. GET 공개 목록 — 추가 쿼리

Path: `GET /api/public/ja-korea/transparency/reports/{type}`  
권한: **없음** (기존과 동일).

### 유지

| 파라미터 | 타입 | 비고 |
|----------|------|------|
| `type` | path, `ANNUAL` \| `AUDIT` | 필수 |
| `page` | int, default `0` | 0-base. 기존 page 정책 |
| `size` | int, default `20` | 상한은 기존 page 정책과 동일 |

### 추가

| Query | 타입 | 의미 | 매칭 |
|-------|------|------|------|
| `q` | string, optional | 검색어 | **제목** 부분일치, **case-insensitive**. trim 후 빈 문자열·미전달이면 무시 |

매칭 구현:

- Admin/공지와 동일하게 `containsPattern(q)` 재사용(길이 상한·escape `%` `_` `\` 동일)이 있으면 그걸 쓴다.
- Spec 예: `lower(title) like pattern`.
- 첨부파일명·본문 검색은 **하지 마라** (목록 계약은 제목 중심).

### 공개 조건 (변경 금지)

기존 공개 list 와 동일하게 **AND** (`type` 일치 + 공개 가능 조건).  
검색은 위 조건 **위에** `q` 조건을 얹는다.

### 정렬 (변경 금지)

기존 공개 list 정렬을 유지한다.

### 응답 (변경 금지)

기존 `PageResponse<PublicReportResponse>`:

| 필드 | 비고 |
|------|------|
| `items[]` | 기존 목록 필드 유지 |
| `totalCount` | **q 적용 후** |
| `page` / `size` / `totalPages` | 동일 |

---

## 2. 구현 위치 (가이드)

| 위치 | 할 일 |
|------|--------|
| `JaTransparencyPublicController#reports` | `@RequestParam(required = false) String q` 추가 → service에 전달 |
| Public list service | `q` 받아 title like. `q` null/blank면 기존 Spec만 |
| OpenAPI | `/v3/api-docs` 에 `q` 노출 |

---

## 3. 검증 체크리스트

- [ ] `GET .../reports/ANNUAL?page=0&size=10` — 200, `q` 추가 전과 동일
- [ ] `GET .../reports/AUDIT?page=0&size=10` — 동일
- [ ] `GET .../reports/ANNUAL?q=<제목에_있는_단어>&page=0&size=10` — 해당 건만, `totalCount` 일치
- [ ] `q=%20` 또는 `q=` — 검색 미적용과 동일
- [ ] 대소문자 다른 `q` 도 매칭
- [ ] `%` `_` 포함 `q` — escape
- [ ] AUDIT type으로 ANNUAL 제목이 나오지 않음 (`type` AND `q`)
- [ ] download API — 회귀 없음
- [ ] `/v3/api-docs` 에 `q` 존재

---

## 4. FE 후속 (백엔드 에이전트는 하지 말 것)

백엔드 배포·검증 후 Platform에서:

- mock → `GET .../transparency/reports/{type}?q=&page=&size=` remote 전환
- `filterReports` 클라 제목 필터 제거 → 서버 페이지네이션
- queryKey에 `type`·`q`·`page`·`size` 포함

이 프롬프트 실행 중에는 **프론트를 고치지 마라.**

---

## Done when

1. 공개 list 에 `q` 가 있고, 제목 부분일치 + 기존 `type`/`page`/`size`·공개 조건·정렬이 맞다.  
2. `totalCount`/`totalPages` 가 검색 결과를 반영한다.  
3. OpenAPI에 `q` 가 보인다.  
4. Admin·다운로드는 회귀 없다.  
5. 프론트 레포는 손대지 않았다.
