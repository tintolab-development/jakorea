# Cursor prompt — 채용 백엔드 완료 → Admin·Platform FE 적용

아래 지시를 **프론트 레포(`jakorea`)에서 실행**하라.  
`JAHOMEADMINBACK` 를 탐색·수정하지 마라. path·JSON·enum·금지는 이 문서만 사용하라.

**OpenAPI 갱신: YES.** 지금 Admin 스냅샷과 Orval 필터에는 채용 path가 없다. fetch·subset·generate 전에 remote를 켜지 마라.

**백엔드 상태 (2026-09-25, 로컬 `:8081`):**

| 항목 | 상태 |
|------|------|
| Flyway `V22__careers.sql` | `ja_cms_local` 에 적용됨 |
| 로컬 시드 `scripts/seed_careers_local.sql` | 적용됨. 안내 UPDATE, 공고 `job-1`…`job-10`, 지원자 0건 |
| 목록·안내 GET·공고 visibility/delete·인재풀 목록/확인/삭제·공개 접수 POST | 라이브 |
| 안내 PUT, 공고 등록·수정, 지원자 첨부, 지원자 `appliedAt` | **없음. 만들지 말고 호출하지 마라** |

한 채팅에서 Admin과 Platform을 같이 하지 마라. **OpenAPI → Admin** 또는 **OpenAPI → Platform** 중 하나로 좁혀라.

---

## 적용 순서

```text
1) OpenAPI fetch·careers subset·generate   ← 필수. 여기 통과 전에 remote 플래그를 켜지 마라
2) Admin FE  (apps/admin)   또는
3) Platform FE (apps/platform)
```

---

## 1) OpenAPI 갱신 (필수 · YES)

로컬 Homepage `:8081` 이 채용 컨트롤러를 띄운 상태에서 fetch한다.

```bash
# 전제: Homepage bootRun --spring.profiles.active=local
# VITE_HOMEPAGE_API_SERVER=http://localhost:8081
pnpm --filter admin fetch:openapi
```

`generate:api` 의 ja-korea 필터는 `/api/admin/ja-korea`, `/api/public/ja-korea` 만 남긴다.  
채용 path는 그 접두사에 없으므로 **별도 subset** 을 추가하라.

1. `apps/admin/scripts/filter-openapi-careers.mjs`  
   `matchPathPrefixes(['/api/admin/careers', '/api/public/careers'])`  
   출력 `careers.openapi.json`
2. `apps/admin/package.json`  
   - `"filter:openapi:careers": "node scripts/filter-openapi-careers.mjs"`  
   - `generate:api` 체인에서 orval 앞에 `pnpm filter:openapi:careers` 를 넣는다.
3. `apps/admin/orval.config.ts` 에 `careers: domainConfig('careers')`

그 다음:

```bash
pnpm --filter admin generate:api
pnpm --filter admin typecheck
```

### 스냅샷에 있어야 하는 path (10)

**Admin**

| Method | Path | 비고 |
|--------|------|------|
| GET | `/api/admin/careers/guide` | VIEW |
| GET | `/api/admin/careers/postings` | VIEW. 필터 쿼리 없음 |
| PATCH | `/api/admin/careers/postings/{id}/visibility` | EDIT **그리고** PUBLISH |
| DELETE | `/api/admin/careers/postings` | body는 **숫자 배열**. EDIT+PUBLISH |
| GET | `/api/admin/careers/talent-applications` | PII_VIEW. `status` `page` `size` 만 |
| PATCH | `/api/admin/careers/talent-applications/{id}/confirm` | PII_VIEW **그리고** EDIT |
| DELETE | `/api/admin/careers/talent-applications` | body는 **숫자 배열**. EDIT |

**Public**

| Method | Path |
|--------|------|
| GET | `/api/public/careers/guide` |
| GET | `/api/public/careers/postings` |
| POST | `/api/public/careers/talent-applications` |

아래 path는 스펙에 **있으면 안 된다.** 있으면 fetch를 커밋하지 말고 중단하라.

- `PUT /api/admin/careers/guide`
- 공고 `POST` / `PUT`
- 지원자 상세, 첨부 upload

### components/schemas

`Career` 접두사가 있어야 한다. 단순 `ListItem` / `ConfirmRequest` 로 들어오면 **커밋하지 마라.**

| Schema | 용도 |
|--------|------|
| `CareerGuideResponse` | 공개 안내 |
| `CareerGuideAdminResponse` | Admin 안내 (`bannerAssetId`, `version` 포함) |
| `CareerCultureItemResponse` | 조직문화 행 |
| `CareerInterviewResponse` | 인터뷰 행 |
| `CareerPostingPublicListResponse` / `CareerPostingPublicItem` | 공개 공고 |
| `CareerPostingAdminListResponse` / `CareerPostingAdminItem` | Admin 공고 |
| `CareerPostingVisibilityRequest` | `{ isPublic, version }` 둘 다 required |
| `CareerTalentApplicationCreateRequest` / `CareerTalentApplicationCreateResponse` | 공개 접수. 응답 `201` |
| `CareerTalentApplicationListItem` | Admin 목록. phone·email **원문** |
| `CareerTalentApplicationConfirmRequest` | `{ version }` only |
| 페이지 래퍼 | `items`, `totalCount`, `page`, `size`, `totalPages`. 생성 이름이 `PageResponseCareerTalentApplicationListItem` 이 아니면 generated 이름을 쓰고, 필드를 바꾸지 마라 |

enum wire는 **대문자**다.

| 필드 | 값 |
|------|-----|
| 공고 status | `RECRUITING` · `RESULT` · `CLOSED` |
| 지원 status | `PENDING` · `CONFIRMED` |
| jobInterest | `MANAGEMENT_PLANNING` · `PR_DESIGN` · `ACCOUNTING` · `HR_ADMIN` · `EDUCATION_OPS` · `OTHER` |
| educationLevel | `HIGH_SCHOOL` · `COLLEGE` · `UNIVERSITY` · `MASTER` · `DOCTOR` · `OTHER` |
| careerType | `NEWBIE` · `EXPERIENCED` |

기존 `ja-korea.openapi.json` path가 줄면 스펙을 커밋하지 마라.

커밋 대상 (OpenAPI 단계):

- `apps/admin/openapi/backend.openapi.json`
- `apps/admin/openapi/careers.openapi.json`
- `apps/admin/src/shared/api/generated/careers/**`
- `apps/admin/scripts/filter-openapi-careers.mjs`
- `apps/admin/package.json`
- `apps/admin/orval.config.ts`

---

## 2) Admin FE (`apps/admin`)

OpenAPI 통과 후에만 `shouldUseRecruit*RemoteApi()` 의 `&& false` 를 풀어라.  
UI에서 `@/shared/api/generated/**` 를 직접 import하지 마라. feature mapper만 generated를 본다.

화면은 그대로 둔다. mock 필드명을 API 필드로 바꾸지 말고 mapper에서 맞춘다.

### 채용 안내 — `features/recruit-guide`

**GET만 remote.** `saveBannerService` / `saveCultureService` / `addInterviewService` / `replaceInterviewService` / `removeInterviewsService` 는 remote를 켜도 호출하지 마라. 저장·추가·삭제는 이 API에 없다. remote일 때 그 동작은 막거나 기존 throw를 유지하라.

`GET /api/admin/careers/guide` → `RecruitGuideData`

| API | FE |
|-----|-----|
| `mainText` | `banner.mainText` (개행 유지) |
| `subTextKo` | `banner.subText01` |
| `subTextEn` | `banner.subText02` |
| `bannerImageUrl` | `banner.imageUrl`. null이면 빈 문자열 |
| `bannerAssetId` | `banner.imageAssetId` |
| `version` | `banner.version`. 문화 행 version은 API에 없다. 쓰지 마라 |
| `cultureItems[].code` | `MAKE_AN_IMPACT`→`make_an_impact`, `KEEP_LEARNING`→`keep_learning`, `SPEAK_OPENLY`→`speak_openly`, `READY_TO_HELP`→`ready_to_help` |
| `label` | `itemLabel` |
| `title` / `description` | 그대로 |
| `interviews[].storyKey` | `InterviewItem.id` 와 `storyId` |
| `year` | `publishedYear` |
| `coverImageUrl` | `imageUrl` |

조직문화는 4행, 인터뷰는 3행. 행을 늘리거나 줄이지 마라.

### 채용공고 — `features/recruit-posting`

`GET /api/admin/careers/postings` 는 `{ items }` 전체다. `CLOSED` 포함. 쿼리 필터는 없다. 기존 `RecruitPostingListFilter` 는 **받은 목록에서** 걸러라.

| API `CareerPostingAdminItem` | FE `RecruitPosting` |
|------------------------------|---------------------|
| `id` (number) | 화면 id는 `String(id)`. PATCH/DELETE에는 number를 쓴다 |
| `status` | `RECRUITING`→`recruiting`, `RESULT`→`result`, `CLOSED`→`closed` |
| `isPublic` | `isPublic` |
| `title` | `title` |
| `publishedOn` | `publishedAt` (`YYYY-MM-DD`). null이면 `''` |
| `authorName`, `recruitStart`, `recruitEnd`, `createdAt` | null이면 `''`. 값을 지어 넣지 마라 |
| `version` | `version` |

`PATCH .../postings/{id}/visibility` body:

```json
{ "isPublic": true, "version": 0 }
```

`DELETE .../postings` body는 `{ "ids": [...] }` 가 아니다.

```json
[1, 2]
```

권한 없으면 토글을 막아라. 공고 등록·수정 모달은 API가 없다. remote에서도 그 모달로 POST/PUT 하지 마라.

### 인재채용 — `features/recruit-applicant`

`GET /api/admin/careers/talent-applications?status=&page=&size=`

- 서버 필터는 `status` (`PENDING`|`CONFIRMED`) 뿐.
- 이름·전화·이메일·직무·경력·날짜 필터는 쿼리에 붙이지 마라. 현재 페이지 `items` 안에서만 걸러라.
- 응답 전화·이메일은 **원문**이다. 마스킹은 기존 Admin 화면에서 하라.
- `appliedAt` 필드는 없다. `''` 로 두고, 날짜를 만들지 마라.

| API | FE |
|-----|-----|
| `id` | `String(id)`. confirm/delete에는 number |
| `status` | `PENDING`→`pending`, `CONFIRMED`→`confirmed` |
| `name` | `applicantName` |
| `phone` / `email` | 그대로 받은 뒤 화면에서 마스크 |
| `jobInterest` | `MANAGEMENT_PLANNING`→`managementPlanning`, `PR_DESIGN`→`prDesign`, `ACCOUNTING`→`accounting`, `HR_ADMIN`→`hrAdmin`, `EDUCATION_OPS`→`educationOps`, `OTHER`→`other` |
| `careerType` | `NEWBIE`→`newbie`, `EXPERIENCED`→`experienced` |
| `confirmedAt` | ISO instant. 없으면 null |
| `version` | `version` |

확인은 일괄 body가 없다. 선택한 각 id마다:

```http
PATCH /api/admin/careers/talent-applications/{id}/confirm
{ "version": 0 }
```

삭제는 숫자 배열 `DELETE` body.

목록·확인 응답은 `Cache-Control: no-store` 다. 캐시에 넣지 마라.

---

## 3) Platform FE (`apps/platform`)

`isHomepageApiConfigured()` 일 때만 remote. 실패·미설정이면 `lib/mock-data.ts` 와 접수 준비 중 문구를 유지하라.  
Platform은 Admin Orval 산출물을 import하지 마라. `features/talent-donation/api/client.ts` 처럼 `features/careers/api/client.ts` 를 두고 axios로 공개 path만 친다. 인증 헤더를 붙이지 마라.

### `GET /api/public/careers/guide`

`/about/careers` 히어로·조직문화·인터뷰.

| API | 화면 |
|-----|------|
| `mainText` | `CAREERS_HERO.titleLines`. `\n` 으로 split. 개행을 공백으로 합치지 마라 |
| `subTextKo` | `descriptionKo`. `\n` split |
| `subTextEn` | `descriptionEn` |
| `bannerImageUrl` | 히어로 이미지. null이거나 로드 실패면 `image/illustration/hero.png` |
| `cultureItems` | code → thrive id: `MAKE_AN_IMPACT`=`impact`, `KEEP_LEARNING`=`learn`, `SPEAK_OPENLY`=`speak`, `READY_TO_HELP`=`help` |
| culture `label` | 카드 영문 타이틀 (`Make an Impact` 등) |
| culture `title` | summary |
| culture `description` | detail |
| `interviews[].storyKey` | `CareersFeaturedStory.id` |
| `title` | title |
| `year` | 연도만. `2026년 08월 15일` 같은 월·일을 만들지 마라 |
| `coverImageUrl` | 커버. 실패하면 `story-metlife.png` |

고정으로 남겨라: 히어로 라벨 `인재채용`, imageAlt, `How We Thrive` 타이틀, thrive `tone` / `column` / `order` / decoration SVG, 인터뷰 `categoryLabel` `스토리`.  
`summaryLines` / `detailLines` / `titleLines` 는 레이아웃용이다. API 문장에 줄바꿈이 있으면 그 줄만 쓰고, 없으면 기존 상수 줄바꿈을 storyKey·code가 같을 때 유지하라.

조직문화 4, 인터뷰 3. 순서는 `displayOrder`.

### `GET /api/public/careers/postings`

`{ items }` 만 있다. `CLOSED` 는 오지 않는다. 클라이언트에서 `CLOSED` 를 다시 넣지 마라.

| API | `CareerJobListItem` |
|-----|---------------------|
| `externalKey` (`job-1`…) | `id` |
| `title` | `title` |
| `status` | `RECRUITING`→`recruiting`, `RESULT`→`result` |
| `publishedOn` | `publishedAtLabel` 은 날짜 문자열 그대로 (`YYYY-MM-DD`) |

검색·페이지는 기존 `filterCareerJobs` / `CAREERS_PAGE_SIZE` 로 이 목록 위에서 하라. 숫자 `id` 로 라우트를 바꾸지 마라.

### `POST /api/public/careers/talent-applications`

`TalentApplyForm` 이 remote일 때 이 POST를 보낸다. `201` 이면 접수 완료.  
`privacyAgreed: false` 는 보내지 마라. 서버는 400이다.  
첨부 API는 없다. 증빙 파일은 올리지 마라.

body 필드명은 폼과 같다. enum만 대문자 wire로 바꾼다.

| 폼 | wire |
|----|------|
| `managementPlanning` | `MANAGEMENT_PLANNING` |
| `prDesign` | `PR_DESIGN` |
| `accounting` | `ACCOUNTING` |
| `hrAdmin` | `HR_ADMIN` |
| `educationOps` | `EDUCATION_OPS` |
| `other` | `OTHER` |
| `highSchool` | `HIGH_SCHOOL` |
| `college` | `COLLEGE` |
| `university` | `UNIVERSITY` |
| `master` | `MASTER` |
| `doctor` | `DOCTOR` |
| `newbie` | `NEWBIE` |
| `experienced` | `EXPERIENCED` |

`addressDetail`, `major`, `educationInfo`, `careerInfo` 는 빈 문자열이면 생략하거나 null.  
응답: `{ "id": 1, "status": "PENDING" }`.

---

## 로컬에서 기대하는 값

시드는 이미 `jaback-postgres-1` / `ja_cms_local` 에 들어가 있다. 프론트 작업 중 다시 넣지 마라.

```bash
curl -s http://localhost:8081/api/public/careers/guide
curl -s http://localhost:8081/api/public/careers/postings
```

- 안내 `mainText` 에 개행 2개. 문화 4, 첫 code `MAKE_AN_IMPACT`. 인터뷰 3, 첫 `story-metlife-2026` / year `2026`.
- 공개 공고 4건 (`job-1`,`job-2` RECRUITING, `job-3`,`job-4` RESULT). `CLOSED` 없음.
- 배너 URL은 `local/seed/careers-hero.png`. 파일이 없으면 이미지는 깨질 수 있다. 그때 로컬 illustration로 떨어뜨려라.
- Admin 지원자 목록은 0건이 정상이다.

---

## Out of scope / 금지

- `JAHOMEADMINBACK` 수정, Flyway·시드·DTO 추가 요청
- 안내 PUT, 공고 작성 모달, 지원자 첨부, `appliedAt` 를 쿼리·body에 추가
- 지원자 더미(`홍길동`)나 공고 29건을 프론트 mock으로 다시 깔기
- 공개 화면에 `CLOSED` 공고 노출
- 전화·이메일 마스킹을 API가 해 주길 기대하기. Admin 화면이 한다
- enum을 소문자 wire로 보내기
- UI에서 generated client 직접 import
- ja-korea subset 에 careers path를 섞기

---

## 회신 템플릿

```text
## OpenAPI
- 갱신: YES / 이미 반영
- careers path 개수:
- Career* schema 확인:

## 연동한 앱
- Admin 또는 Platform:

## 화면
- remote로 바꾼 호출:
- 그대로 막은 호출 (안내 저장, 공고 작성, 첨부):

## 검증
- 공개 안내 개행 / 문화 4 / 인터뷰 3:
- 공개 공고에 CLOSED 없음:
- 지원자 목록 0건:

## 하지 않은 일
- 백엔드 수정 없음
```

**Last updated:** 2026-09-25
