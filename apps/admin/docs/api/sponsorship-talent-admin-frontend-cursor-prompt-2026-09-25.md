# Cursor prompt — Admin 재능기부 mock → Homepage API

아래 지시를 **프론트 레포(`jakorea`)의 `apps/admin`에서 실행**하라.  
백엔드 레포(`JAHOMEADMINBACK`)를 탐색·수정하지 마라. 엔드포인트·JSON·매핑·금지는 이 문서만 사용하라.  
질문이 필요하면 Orval 생성 타입이 이 문서와 충돌할 때만 하라.

**OpenAPI 선결:** `openapi/sponsorship.openapi.json` 에 talent path가 있어야 한다.  
없으면 [`sponsorship-talent-openapi-update-2026-09-25.md`](./sponsorship-talent-openapi-update-2026-09-25.md) 대로 fetch → generate 한 뒤 이 프롬프트를 진행하라.  
최종은 Orval `getJAKoreaHomepageAdminAPISponsorshipSubset()` — hand `client.ts`만 두고 끝내지 마라.

확인 기준: Homepage `:8081` Swagger에 talent path가 있고, regenerate regenerate 후 `TalentApplication*` / `TalentSponsorship*` schema가 보인다.  
`capabilities`는 `shouldUseHomepageRemoteApi()` 기준(로그인 JWT)이다.

개인후원·기업후원·기업 상담은 이 작업 대상이 아니다. 참고 패턴만 본다.

---

## Goal

| 영역 | feature | 지금 | 목표 |
|------|---------|------|------|
| 재능기부 신청 | `talent-donation-application` | JWT remote / localStorage fallback | Admin list/filter/detail/status/delete/attachment-download |
| 재능기부 소개 | `talent-donation-intro` | JWT remote / localStorage fallback | Admin get + banner/how/interview PUT |

완료 조건:

1. `shouldUseTalentDonationApplicationRemoteApi()` / `shouldUseTalentDonationIntroRemoteApi()` 가 `shouldUseHomepageRemoteApi()` 를 따른다.
2. remote on일 때 store mock을 읽지 않는다. remote off일 때만 localStorage.
3. Orval sponsorship 클라이언트를 재생성한 뒤 feature `service`/`mappers`만 연동한다. UI에서 generated import 금지.
4. 기업 상담(`corporate-consultation`)의 `StatusUpdateRequest`(version 포함) OpenAPI/클라이언트를 덮어쓰지 않는다. talent 스키마 이름은 `TalentApplication*` / `TalentSponsorship*` 접두사다.
5. 백엔드·DTO·Flyway를 수정하지 않는다.
6. 끝나면 아래 회신 템플릿으로 답한다.

로컬 Homepage: `:8081`. `pnpm --filter admin fetch:openapi && pnpm --filter admin generate:api` 후 typecheck.

참고 구현: `features/corporate-consultation/api/{capabilities,service,mappers}.ts`  
(단, talent 신청은 **version 없음**, 삭제는 **id 배열**, enum wire는 **소문자**.)

---

## Out of scope / 금지

- `JAHOMEADMINBACK` 수정, OpenAPI `@Schema` 이름 되돌리기.
- Platform(`apps/platform`) 재능기부 공개 신청/소개 연동 (별도 작업).
- 개인후원·기업후원·기업 상담 capabilities/service 변경.
- UI에서 `@/shared/api/generated/**` 직접 import.
- talent 신청에 corporate `BulkRequest`/`version` 패턴 강제.
- status를 `PENDING`/`CONFIRMED` 대문자로 보내기. **wire는 `pending`|`confirmed`.**
- gender/jaParticipation도 `male`|`female`, `yes`|`no` (소문자).
- 상세 없이 목록 row만으로 전체 PII를 채우기. 목록 `phone`은 마스킹이다.
- 첨부 다운로드 URL을 상세 JSON에 기대하기. **별도 download API**.
- intro 인터뷰 썸네일/스토리 제목을 talent API가 준다고 가정하기. `linkedStoryId`만 온다 — 제목·썸네일은 기존 impact-story 조회/피커로 보강.

---

## 0) Orval 재생성 (필수 · 스냅샷에 talent 없음)

상세 체크리스트: [`sponsorship-talent-openapi-update-2026-09-25.md`](./sponsorship-talent-openapi-update-2026-09-25.md)

```bash
pnpm --filter admin fetch:openapi
pnpm --filter admin generate:api
pnpm --filter admin typecheck
```

기대 스키마 이름(일부):

- `TalentApplicationListItem`
- `TalentApplicationDetailResponse`
- `TalentApplicationStatusUpdateRequest` — body `{ "status": "confirmed" }` only
- `TalentApplicationAttachmentDownloadResponse`
- `TalentSponsorshipAdminResponse` / `TalentSponsorshipBannerResponse` / …
- corporate `StatusUpdateRequest` 는 그대로 **version 필수**여야 한다. talent 연동 후 corporate 생성 타입에서 `version`이 사라지면 **즉시 중단**하고 보고.

생성된 axios 메서드 이름은 Orval이 정한다. path로 찾아 `getJAKoreaHomepageAdminAPISponsorshipSubset()`에 붙인다.  
기존 hand-written `features/talent-donation-*/api/client.ts`·로컬 wire types가 있으면 Orval 연동 후 제거하고 service는 generated만 쓰게 한다.

---

## 1) 재능기부 신청 — Admin API

Base: `/api/admin/sponsorship/talent-applications`  
권한: 목록 `HOMEPAGE_VIEW`, 상세·첨부 `HOMEPAGE_PII_VIEW`, 상태·삭제 `HOMEPAGE_EDIT`.

### `GET /api/admin/sponsorship/talent-applications`

Query (모두 optional, page 기본 0, size 기본 20):

| query | 의미 | 도메인 filter |
|-------|------|----------------|
| `status` | `pending` \| `confirmed` | `status` |
| `applicantName` | 이름 부분검색 | `applicantName` |
| `phone` | 전화 부분검색 | `phone` |
| `email` | 이메일 부분검색 | `email` |
| `jaParticipation` | `yes` \| `no` | `jaProgramHistory`: yes→true 필터, no→false |
| `appliedFrom` / `appliedTo` | `YYYY-MM-DD` | `appliedFrom` / `appliedTo` |
| `confirmedFrom` / `confirmedTo` | `YYYY-MM-DD` | `confirmedFrom` / `confirmedTo` |
| `page` / `size` | 페이지 | size=20 권장 |

응답 shape (`PageResponse`):

```json
{
  "items": [
    {
      "id": 1,
      "status": "pending",
      "name": "홍길동",
      "phone": "010-****-5678",
      "email": "hong@example.com",
      "gender": "male",
      "jaParticipation": "yes",
      "sido": "서울특별시",
      "sigungu": "강서구",
      "appliedAt": "2026-09-20T01:00:00Z",
      "confirmedAt": null,
      "confirmedByName": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalCount": 1
}
```

목록 → 도메인 매핑:

| API | 도메인 `TalentDonationApplication` |
|-----|-------------------------------------|
| `id` (number) | `String(id)` |
| `status` | 그대로 `pending`\|`confirmed` |
| `name` | `applicantName` |
| `phone` | `phone` (마스킹 유지) |
| `email` | `email` |
| `gender` | `male`\|`female` |
| `jaParticipation` `yes`/`no` | `jaProgramHistory` boolean |
| `sido` + `sigungu` | `homeAddress` = `` `${sido} ${sigungu}``.trim() `` |
| `appliedAt` | `appliedAt` |
| `confirmedAt` / `confirmedByName` | 그대로 |
| (없음) | `birthDate`/`affiliation`/`availableFrom`/`availableTo`/`bio`/`talentIntro`/`motivation`/`attachment*` → 목록에서는 빈 값·null로 채우고 **상세에서만** 채움 |
| (없음) | `version` → `0` 고정 (API에 version 없음. optimistic lock 없음) |
| (없음) | `privacyConsent` → 목록 `true` 고정 |

### `GET /api/admin/sponsorship/talent-applications/{id}`

상세 (PII). 열람 시 서버가 privacy log를 남긴다 — 프론트는 별도 log API를 호출하지 않는다.

```json
{
  "id": 1,
  "status": "pending",
  "name": "홍길동",
  "birthDate": "1990-01-15",
  "gender": "female",
  "phone": "01012345678",
  "email": "hong@example.com",
  "affiliation": "OO회사",
  "sido": "서울특별시",
  "sigungu": "강서구",
  "periodStart": "2026-10-01",
  "periodEnd": "2026-12-31",
  "bio": "…",
  "talentIntro": "…",
  "motivation": "…",
  "jaParticipation": "no",
  "privacyAgreed": true,
  "appliedAt": "2026-09-20T01:00:00Z",
  "confirmedAt": null,
  "confirmedByName": null,
  "attachmentAssetId": 12,
  "attachmentOriginalName": "portfolio.pdf"
}
```

상세 → 도메인:

| API | 도메인 |
|-----|--------|
| `name` | `applicantName` |
| `sido`+`sigungu` | `homeAddress` |
| `periodStart` / `periodEnd` | `availableFrom` / `availableTo` |
| `jaParticipation` | `jaProgramHistory` boolean |
| `privacyAgreed` | `privacyConsent` (`true`만 기대) |
| `attachmentOriginalName` | `attachmentFileName` |
| `attachmentUrl` | **항상 null** — 다운로드는 아래 API |
| `version` | `0` |

### `GET /api/admin/sponsorship/talent-applications/{id}/attachment-download`

```json
{
  "originalName": "portfolio.pdf",
  "downloadUrl": "https://…presigned…",
  "expiresAt": "2026-09-25T08:05:00Z"
}
```

기업 상담의 `downloadCorporateConsultationAttachmentService`와 같이, 상세 모달에서 파일 클릭 시 이 API를 호출해 `downloadUrl`로 이동/다운로드한다.  
첨부가 없으면 404성 에러 — UI는 파일 행을 숨기거나 비활성.

### `PATCH /api/admin/sponsorship/talent-applications/{id}/status`

Body **only**:

```json
{ "status": "confirmed" }
```

- `pending`으로 되돌리기 **불가**. 서버가 validation 거부.
- `version` 필드 **넣지 마라**.
- 응답: list item shape (마스킹 phone).
- 일괄 확인 UI가 여러 id를 다루면 **id마다 PATCH** (bulk status API 없음).

### `DELETE /api/admin/sponsorship/talent-applications`

Body: JSON 배열 of number ids (최대 100).

```json
[1, 2, 3]
```

corporate `BulkRequest`(`{ items: [{id, version}] }`) **사용 금지**.

---

## 2) 재능기부 소개 — Admin API

Base: `/api/admin/sponsorship/talent`

### `GET /api/admin/sponsorship/talent`

```json
{
  "banner": {
    "mainText": "…",
    "subText": "…",
    "imageAssetId": 101,
    "version": 1
  },
  "howItems": [
    { "id": 1, "title": "…", "description": "…", "version": 1 },
    { "id": 2, "title": "…", "description": "…", "version": 1 },
    { "id": 3, "title": "…", "description": "…", "version": 1 }
  ],
  "interviews": [
    {
      "id": "interview_01",
      "mainText": "…",
      "subText": "…",
      "buttonLabel": "인터뷰 보기",
      "linkedStoryId": null,
      "version": 1
    },
    {
      "id": "interview_02",
      "mainText": "…",
      "subText": "…",
      "buttonLabel": "인터뷰 보기",
      "linkedStoryId": null,
      "version": 1
    }
  ],
  "updatedAt": "2026-09-25T00:00:00Z"
}
```

도메인 매핑:

| API | 도메인 |
|-----|--------|
| `banner.imageAssetId` | `imageAssetId`; `imageUrl`은 기존 asset URL resolve 패턴(개인후원 배너와 동일) |
| `howItems` (정확히 3) | `HowItem` id `1\|2\|3` |
| `interviews[].id` | `interview_01` \| `interview_02` |
| `linkedStoryId` (number\|null) | `linkedStoryId` string\|null (`String(id)` / null) |
| (없음) | `linkedStoryTitle` / `thumbnailUrl` — 피커·impact-story 조회로 채움. API만으로 비우면 `''` |

### `PUT /api/admin/sponsorship/talent/banner`

```json
{
  "imageAssetId": 101,
  "mainText": "…",
  "subText": "…",
  "version": 1
}
```

optimistic lock: `version` 필수. 응답은 갱신된 banner (+ version).

이미지 업로드는 기존 Homepage asset 업로드 파이프라인(개인후원 배너와 동일 purpose/흐름)을 재사용. purpose가 OpenAPI/asset 문서에 없으면 **백엔드를 추측해 바꾸지 말고** 기존 intro mock의 asset 업로드 코드가 있으면 그걸 remote에 연결.

### `PUT /api/admin/sponsorship/talent/how-items`

```json
{
  "items": [
    { "id": 1, "title": "…", "description": "…", "version": 1 },
    { "id": 2, "title": "…", "description": "…", "version": 1 },
    { "id": 3, "title": "…", "description": "…", "version": 1 }
  ]
}
```

항상 **3개**. 응답: how item 배열.

### `PUT /api/admin/sponsorship/talent/interviews/{slotId}`

`slotId`: `interview_01` \| `interview_02`

```json
{
  "mainText": "…",
  "subText": "…",
  "buttonLabel": "…",
  "linkedStoryId": 42,
  "version": 1
}
```

`linkedStoryId`는 number 또는 해제 시 null(서버가 null 허용). 문자열 id를 Number로 변환; 유효하지 않으면 저장 전 UI validation.

---

## 3) 구현 순서 (파일)

1. Orval regenerate + corporate `StatusUpdateRequest.version` 존재 확인.
2. `talent-donation-application/api/capabilities.ts` → `shouldUseHomepageRemoteApi()`.
3. `mappers.ts` — list/detail/status/delete params·body 매핑 (위 표).
4. `service.ts` — remote 분기: list / get / confirm(PATCH per id) / remove(DELETE id[]) / attachment download.
5. hooks·detail modal이 attachment download service를 쓰도록 연결 (corporate 상담과 동일 UX).
6. `talent-donation-intro/api/capabilities.ts` → remote on.
7. intro `mappers.ts` / `service.ts` — get + 3 PUT. 저장 후 get 재조회 또는 응답으로 캐시 갱신(기존 queryKey 유지).
8. `pnpm --filter admin typecheck`. UI smoke: 목록 필터, 상세 PII, 확인, 삭제, 첨부 다운로드, intro 배너/how/인터뷰 저장.

local mock store·시드 데이터는 remote off fallback으로 **삭제하지 마라**.

---

## 4) 회신 템플릿

```text
## 결과
- Orval: (재생성 여부 / corporate StatusUpdateRequest.version 유지 여부)
- application remote: (capabilities / list·detail·status·delete·attachment)
- intro remote: (capabilities / get·banner·how·interview)
- 매핑 이슈: (있으면 필드명)
- typecheck: (pass/fail)
- 수동 확인: (목록 필터 / 상세 / 확인 / 삭제 / 첨부 / intro 저장)
```

이 프롬프트와 Orval 타입이 충돌하면 **프롬프트의 wire 값·path·version 유무**를 우선하고, 생성 메서드 이름만 Orval에 맞춘다.
