# Cursor prompt — 인재채용 Admin 목록 필터·신청일시 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. path·enum·쿼리명은 이 문서만 사용하라.

질문이 필요하면 스키마·권한·기존 Flyway가 값을 거부할 때만 하라.

---

## 배경 (2026-09-26 FE 기준)

Admin `인재채용 관리` (`/ja-korea/recruit/applicants`) 는 이미 아래를 호출한다.

| Method | Path | FE |
|--------|------|-----|
| GET | `/api/admin/careers/talent-applications` | 목록. 쿼리는 **`status` `page` `size`만** 보냄 |
| PATCH | `/api/admin/careers/talent-applications/{id}/confirm` | 선택 확인. body `{ version }` |
| DELETE | `/api/admin/careers/talent-applications` | 선택 삭제. body **숫자 id 배열** |

화면 필터는 더 많다. 서버가 받지 않는 조건은 **현재 페이지 `items`(최대 size) 안에서만** 거른다.  
목록 응답에 **`appliedAt`이 없어** 신청일시 컬럼은 비어 있고, 신청일 범위 필터는 서버 없이는 동작하지 않는다.

이 작업의 목표는 **목록 GET만 확장**하는 것이다. confirm·delete 계약은 바꾸지 마라.

---

## Goal

1. `GET /api/admin/careers/talent-applications` 가 아래 **추가 쿼리**로 DB에서 걸러 반환한다.
2. 목록 item에 **`appliedAt`**(ISO-8601 instant)을 포함한다.
3. OpenAPI(로컬 `/v3/api-docs`)에 쿼리·필드가 반영된다.
4. 기존 `status`·`page`·`size`·confirm·delete·공개 POST 동작은 회귀 없이 유지한다.

완료 조건:

```bash
# 인증: Admin JWT (PII_VIEW)
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/careers/talent-applications?page=0&size=20'
```

- 응답 `items[]` 에 `appliedAt` 이 있다(없으면 null 허용이지만, 시드·실데이터는 값이 있어야 한다).
- 아래 쿼리를 **조합**해도 200이며, 조건에 맞는 행만 온다.

---

## Out of scope / 금지

- 안내 `PUT`, 공고 POST/PUT, 지원자 첨부 upload, 지원자 상세 GET 신설(이번 범위 아님).
- confirm·delete path·body 형태 변경.
- 공개 `POST /api/public/careers/talent-applications` 필드 변경.
- Admin/Platform 프론트 파일 수정.
- `status` enum 추가(`REJECTED` 등). 지금은 `PENDING` | `CONFIRMED` 만.
- 전화·이메일을 응답에서 마스킹. **원문**을 내려라(마스킹은 Admin FE).

---

## 1. GET 목록 — 추가 쿼리

Path: `GET /api/admin/careers/talent-applications`  
권한: 기존과 동일 (**PII_VIEW**).

### 유지

| Query | 타입 | 비고 |
|-------|------|------|
| `status` | `PENDING` \| `CONFIRMED` | optional |
| `page` | int, default `0` | 0-base |
| `size` | int, default `20` | |

### 추가 (모두 optional)

| Query | 타입 | 의미 | 매칭 |
|-------|------|------|------|
| `jobInterest` | enum | 관심 직무 | exact |
| `name` | string | 지원자명 | **부분일치** (case-insensitive). trim 후 빈 문자열이면 무시 |
| `phone` | string | 연락처 | 숫자만 남겨 **부분일치** |
| `email` | string | 이메일 | **부분일치** (case-insensitive) |
| `careerType` | enum | 경력 | exact |
| `appliedFrom` | `YYYY-MM-DD` | 신청일 시작(포함) | `appliedAt` 의 날짜(서버 TZ 또는 UTC date) ≥ |
| `appliedTo` | `YYYY-MM-DD` | 신청일 끝(포함) | ≤ |
| `confirmedFrom` | `YYYY-MM-DD` | 확인일 시작 | `confirmedAt` 기준. null 행은 제외 |
| `confirmedTo` | `YYYY-MM-DD` | 확인일 끝 | 동일 |

### enum wire (공개 접수와 동일)

`jobInterest`:

- `MANAGEMENT_PLANNING` · `PR_DESIGN` · `ACCOUNTING` · `HR_ADMIN` · `EDUCATION_OPS` · `OTHER`

`careerType`:

- `NEWBIE` · `EXPERIENCED`

잘못된 enum·날짜 형식이면 **400**. 알 수 없는 쿼리 키는 무시해도 된다.

### 정렬

기본: `appliedAt` **내림차순**, 동점이면 `id` 내림차순.  
`appliedAt`이 null이면 맨 뒤.

### 페이지 응답

기존 `PageResponseCareerTalentApplicationListItem` 유지.

| 필드 | 의미 |
|------|------|
| `items` | 현재 페이지 |
| `totalCount` | **필터 적용 후** 전체 건수 |
| `page` / `size` / `totalPages` | 기존과 동일 |

---

## 2. 목록 item — `appliedAt` 추가

스키마 `CareerTalentApplicationListItem` 에 필드를 추가하라.

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| `id` | int64 | yes | |
| `status` | `PENDING`\|`CONFIRMED` | yes | |
| `jobInterest` | enum | yes | |
| `careerType` | enum | yes | |
| `name` | string | yes | |
| `phone` | string | yes | 원문 |
| `email` | string | yes | 원문 |
| `confirmedAt` | string (ISO instant) \| null | no | 미확인이면 null |
| `appliedAt` | string (ISO instant) \| null | **yes(권장)** | 접수 시각. 공개 POST 시점에 저장한 값 |
| `version` | int | yes | optimistic lock |

`appliedAt` 컬럼이 테이블에 없으면 Flyway로 추가하고, 기존 행은 `created_at`(또는 동등)으로 backfill 하라.  
local 시드 지원자가 0건이어도 스키마·OpenAPI는 내려야 한다.

---

## 3. OpenAPI

로컬 docs에 반영된 뒤 Admin이 `pnpm --filter admin fetch:openapi` → careers filter → generate 할 수 있어야 한다.

- operationId 이름을 굳이 바꾸지 마라(기존 `list_14` 등 유지 가능).
- parameters·schema에 위 쿼리·`appliedAt`이 보여야 한다.

---

## 4. 검증

```bash
TOKEN=... # Admin JWT with PII_VIEW

# 기본 목록 — items[].appliedAt 존재
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/careers/talent-applications?page=0&size=20'

# status
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/careers/talent-applications?status=PENDING&page=0&size=20'

# 직무·경력
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/careers/talent-applications?jobInterest=EDUCATION_OPS&careerType=NEWBIE&page=0&size=20'

# 이름·전화·이메일 부분일치
curl -sS -H "Authorization: Bearer $TOKEN" \
  --get 'http://localhost:8081/api/admin/careers/talent-applications' \
  --data-urlencode 'name=홍' \
  --data-urlencode 'phone=010' \
  --data-urlencode 'email=@jakorea' \
  --data-urlencode 'page=0' \
  --data-urlencode 'size=20'

# 신청일·확인일
curl -sS -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/admin/careers/talent-applications?appliedFrom=2026-01-01&appliedTo=2026-12-31&page=0&size=20'
```

체크:

1. 필터 없는 목록의 `totalCount` ≥ `items.length`
2. `name` 등으로 좁히면 `totalCount`가 줄어든다
3. 잘못된 `jobInterest=FOO` → 400
4. confirm/delete 기존 계약 유지
5. 무토큰 → 401

---

## 5. FE 후속 (백엔드 완료 후 · 이 레포에서 하지 마라)

백엔드가 끝나면 **별도 프론트 채팅**에서:

1. OpenAPI fetch·careers generate
2. `toTalentApplicationListParams` 에 위 쿼리 매핑
3. `mapCareerTalentApplicationListItem` 에 `appliedAt` 매핑
4. 클라이언트 쪽 이름·직무·날짜 재필터 제거(서버 결과 신뢰)
5. `totalCount`를 응답 `totalCount`로 표시

---

## 참고 — 현재 FE 화면 필터 ↔ 기대 쿼리

| 화면 | Query |
|------|-------|
| 처리 상태 | `status` (`pending`→`PENDING`, `confirmed`→`CONFIRMED`) |
| 관심 직무 | `jobInterest` |
| 지원자명 | `name` |
| 연락처 | `phone` |
| 이메일 | `email` |
| 경력 | `careerType` |
| 신청일 | `appliedFrom` / `appliedTo` |
| 확인일 | `confirmedFrom` / `confirmedTo` |
