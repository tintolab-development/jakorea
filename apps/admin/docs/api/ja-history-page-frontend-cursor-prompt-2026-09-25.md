# Cursor prompt — JA History 페이지 → Admin·Platform FE 적용

아래 지시를 **프론트 레포(`jakorea`)에서 실행**하라.  
`JAHOMEADMINBACK` 를 탐색·수정하지 마라. path·JSON·금지는 이 문서만 사용하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/ja-history-page-frontend-cursor-prompt-2026-09-25.md`

---

## OpenAPI 갱신: YES

**필요 여부: YES.** 지금 Admin 스냅샷(`openapi/ja-korea.openapi.json`)에는 이 페이지 path가 없다.  
Orval 타입이 생기기 전에는 remote를 켜지 마라.

**지금은 fetch하지 마라.** Homepage `:8081`의 `/v3/api-docs`에 아래가 **모두** 보이기 전에 `pnpm --filter admin fetch:openapi` 를 실행하면, purpose enum만 바뀌거나 페이지 스키마가 빠진 스냅샷을 커밋하게 된다.

fetch 전에 로컬 `:8081` Swagger 또는 `/v3/api-docs`에서 확인할 것:

- `GET /api/admin/ja-korea/ja-history`
- `GET /api/public/ja-korea/ja-history`
- components/schemas 에 `JaHistoryPageResponse`
- `AssetPurpose` 에 `JA_HISTORY_HERO_IMAGE`, `JA_HISTORY_WORLD_TIMELINE_IMAGE`, `JA_HISTORY_KOREA_TIMELINE_IMAGE`, `JA_HISTORY_LOCKED_MEDIA`

하나라도 없으면 **중단**하고 백엔드에 컨트롤러·`@Schema(name=JaHistoryPage…)` 반영을 요청하라. 스냅샷을 커밋하지 마라.

springdoc가 기동 중인 앱에서 `/v3/api-docs`를 만든다. 백엔드 레포에 고칠 OpenAPI yaml 파일은 없다. FE가 fetch하는 것이 갱신이다.

준비가 된 뒤에만:

```bash
pnpm --filter admin fetch:openapi
pnpm --filter admin generate:api
pnpm --filter admin typecheck
```

별도 Orval project는 만들지 마라. path prefix가 이미 `ja-korea`(`/api/admin/ja-korea`, `/api/public/ja-korea`)와 `assets`에 들어간다.

커밋 대상: `openapi/backend.openapi.json`, `openapi/ja-korea.openapi.json`, `openapi/assets.openapi.json`, `src/shared/api/generated/ja-korea/**`, `src/shared/api/generated/assets/**`.

### 스냅샷에 있어야 하는 path

| Method | Path |
|--------|------|
| GET | `/api/admin/ja-korea/ja-history` |
| PUT | `/api/admin/ja-korea/ja-history/hero` |
| PUT | `/api/admin/ja-korea/ja-history/origin` |
| PUT | `/api/admin/ja-korea/ja-history/eras` |
| PUT | `/api/admin/ja-korea/ja-history/world-timeline` |
| PUT | `/api/admin/ja-korea/ja-history/korea-timeline` |
| PUT | `/api/admin/ja-korea/ja-history/philosophy` |
| PUT | `/api/admin/ja-korea/ja-history/thrive` |
| PUT | `/api/admin/ja-korea/ja-history/cta` |
| GET | `/api/public/ja-korea/ja-history` |

### 스키마 이름

`JaHistoryPage` 접두사가 있어야 한다. 예: `JaHistoryPageResponse`, `JaHistoryPagePublicResponse`, `JaHistoryPageHeroUpdateRequest`, `JaHistoryPageTimelineUpdateRequest`, `JaHistoryPageMediaResponse`.

아래 이름으로 이 페이지가 들어오면 **커밋하지 말고 중단**한다.

- `HistoryResponse` (기존 연혁/수상/인증 목록. `published`, `year`, `month`, `content` 유지)
- `BannerResponse`

생성된 타입이 이 문서의 JSON과 다르면 그 차이만 질문하고, 추측으로 필드를 바꾸지 마라.

한 채팅에서 OpenAPI·Admin·Platform을 같이 하지 마라. **OpenAPI → Admin** 또는 **OpenAPI → Platform** 중 하나.

---

## 이 화면이 아닌 것

이미 있는 연혁/수상/인증 목록이다. 호출·타입·화면을 바꾸지 마라.

- `GET/POST /api/admin/ja-korea/history`
- `GET/PUT/DELETE /api/admin/ja-korea/history/{id}`
- `PATCH /api/admin/ja-korea/history/{id}/published`
- `POST /api/admin/ja-korea/history/bulk-delete`

Admin 게이트는 `src/features/ja-history/api/capabilities.ts` 의 `shouldUseJaHistoryRemoteApi` 이다. 지금은 `&& false` 로 localStorage만 쓴다. OpenAPI 검증이 끝나기 전에는 `false`를 빼지 마라.

---

## 문서 계약

싱글톤 1건. 목록·페이지네이션·게시 on/off 없음.

관리자 조회·저장 성공 응답은 페이지 전체 + `updatedAt` + `version`.  
PUT body는 해당 섹션과 `version`만. `version`이 다르면 409. 409면 페이지를 다시 GET 하라.

공개 `GET /api/public/ja-korea/ja-history` 는 로그인 없음. 섹션과 `updatedAt`은 같고 `version`은 없다.

### 미디어

```json
{ "assetId": 1, "fileName": "hero-visual.png", "alt": "JA History 히어로", "url": "https://..." }
```

`url`만 null일 수 있다. `fileName`과 `alt`는 그때도 있다. asset이 없으면 필드 자체가 null이다.  
기존 `JaHistoryMedia`는 `assetId`가 없고 `url`이 필수 문자열이다. 어댑터에서 `url ?? ''` 로 맞추고, 다음 저장에 쓸 `assetId`는 버려지 마라.

### 잠금 (조회만, PUT에 넣지 마라)

| 섹션 | 잠금 |
|------|------|
| origin | `yearMark`, `learningImage` |
| eras | `year` 집합, 각 행 `image`. 캡션만 저장 |
| philosophy | 카드 `id`, 카드 `image` |
| thrive | 카드 `id`, 카드 `decoration` |
| cta | `image` |
| world / korea timeline | `periods[].id`, `periods[].label`, `events[].year` |

기간 4개, 카드 4개는 항상 둔다. 이벤트가 없는 기간은 `title: ""`, `events: []`. 응답에서 빼지 마라.

`label`은 요청에 넣지 마라. 서버 값을 그대로 보여 준다.

| scope | id | label | 연도 |
|-------|----|-------|------|
| world | `1919-1929` | `1919-1929` | `1919`, `1920`, `1929` |
| world | `1955-1962` | `1955-1962` | 없음 |
| world | `1969-2000` | `1969-2000` | 없음 |
| world | `2019-now` | `2019-Now` | 없음 |
| korea | `2002-2006` | `2002-2006` | `2002`, `2003`, `2006` |
| korea | `2007-2015` | `2007-2015` | 없음 |
| korea | `2016-2020` | `2016-2020` | 없음 |
| korea | `2021-now` | `2021-NOW` | 없음 |

philosophy 카드 순서: `practice`, `role-model`, `mindset`, `support`  
thrive 카드 순서: `empower`, `digital`, `partner`, `enablers`  
era 연도: `1920`, `1950`, `1960`, `1980`

와이어의 `year`는 number다. 기존 엔티티는 string이다. 읽을 때 `String(year)`, 쓸 때 number로 보낸다.

`1920` 이벤트 문구 `Junior Achivement로 이름 변경` 철자를 고치지 마라.

본문 중간의 개행·빈 줄은 유지한다. 앞뒤 공백만 있는 값은 400이다.

### 저장 body

공통: `version` (number, 필수). 성공 시 관리자 페이지 전체.

| PUT | body |
|-----|------|
| hero | `imageAssetId`, `eyebrow`, `mainText` |
| origin | `title`, `body`, `learningEyebrow`, `learningTitle`, `learningBody`, `learningOutro`, `learningEmphasis` |
| eras | `items`: 길이 4. `{ year, caption }` |
| world-timeline / korea-timeline | `imageAssetId`, `title`, `body`, `periods`: `{ id, title, events: [{ year, text }] }` |
| philosophy | `eyebrow`, `title`, `lead`, `cards`: `{ id, title, description }` |
| thrive | `title`, `lead`, `footnote`, `cards`: `{ id, title, description }` |
| cta | `title`, `body`, `primaryLabel`, `primaryHref`, `secondaryLabel`, `secondaryHref` |

히어로·연혁 `imageAssetId`가 없으면 400. 파일을 새로 고르지 않았으면 마지막 GET의 `assetId`를 다시 보낸다.  
`primaryHref` / `secondaryHref`는 `/programs`, `/impact` 같은 사이트 경로다.

조회 섹션 모양 (PUT 성공 응답도 이 페이지 전체):

- `hero`: `image`, `eyebrow`, `mainText`
- `origin`: 텍스트 필드 + `yearMark`, `learningImage`
- `eras`: `{ items: [{ year, caption, image }] }`
- `worldTimeline` / `koreaTimeline`: `image`, `title`, `body`, `periods`
- `philosophy`: `eyebrow`, `title`, `lead`, `cards` (`image` 포함)
- `thrive`: `title`, `lead`, `footnote`, `cards` (`decoration` 포함)
- `cta`: 텍스트·href + `image`
- `updatedAt`, 관리자만 `version`

기존 `JaHistoryData.eras`는 배열이다. 와이어 `eras.items`를 그 배열로 펼쳐라.

### 이미지 업로드

새 업로드 path를 만들지 마라. 기존 asset `prepareUpload` → 바이너리 PUT → `confirmUpload` (`src/shared/api/generated/assets`, 예: `features/hero-banner/api/upload-hero-image.ts`).

| purpose | 쓰는 PUT | 허용 |
|---------|----------|------|
| `JA_HISTORY_HERO_IMAGE` | hero `imageAssetId` | jpeg/png, 최대 15MB |
| `JA_HISTORY_WORLD_TIMELINE_IMAGE` | world-timeline | 같음. 1920×1080, 1440×380은 안내만. 검증하지 마라 |
| `JA_HISTORY_KOREA_TIMELINE_IMAGE` | korea-timeline | 같음 |
| `JA_HISTORY_LOCKED_MEDIA` | 호출하지 마라 | prepareUpload는 400. SVG 포함이어도 관리자 업로드 금지 |

히어로·연혁에 SVG를 허용하지 마라. 잠금 이미지(연도 그래픽, 배움 사진, 시대 사진, 철학 카드, Thrive 장식, CTA 사진)를 저장으로 바꾸지 마라.

---

## Admin (`apps/admin`)

대상: `src/features/ja-history/**`, `src/entities/ja-history/**`.

1. OpenAPI 이후로 generated `ja-korea` 클라이언트를 쓴다. UI에서 generated를 직접 import하지 마라. `features/ja-history/api` 어댑터가 `JaHistoryData` / 기존 save input과 와이어를 변환한다.
2. 관리자 모델에 `version`을 둔다. 공개 타입에는 넣지 마라. PUT마다 마지막 응답의 `version`을 보낸다.
3. `shouldUseJaHistoryRemoteApi`의 `&& false`는 어댑터와 typecheck가 된 뒤에만 제거한다. localStorage 시드(`api/store.ts`, `api/seed.ts`)는 remote가 꺼진 경로로 남겨라.
4. 저장 성공 응답으로 쿼리 캐시를 통째로 갱신한다. 409는 재조회. 400 문구는 그대로 보여 준다.
5. 화면 레이아웃을 새로 그리지 마라. 데이터 소스만 바꾼다.

---

## Platform (`apps/platform`)

대상: `/about/history` (`src/features/history`, `src/pages/about/history`).

1. `GET /api/public/ja-korea/ja-history` 한 번. 인증 헤더 없음. `version`을 기대하지 마라.
2. 정적 `mock-data.ts` / `constants.ts` 문구를 이 응답으로 바꾼다. 개행을 한 줄로 합치지 마라.
3. 빈 기간·빈 제목을 필터로 제거하지 마라.
4. `url`이 null이어도 캡션·alt·fileName이 있으면 그 블록을 유지한다.
5. Platform용 OpenAPI fetch 스크립트는 없다. 공개 GET용 얇은 클라이언트만 추가한다. Admin Orval 산출물을 platform에 복사하지 마라.

---

## 하지 마라

- 백엔드 레포 수정
- `/api/admin/ja-korea/history` 목록 화면 수정
- 기간·연도·카드 id를 추가·삭제하는 UI
- 시드 오타 `Junior Achivement` 교정
- 잠금 미디어 업로드
- path가 스냅샷에 없는데 remote 게이트를 켜기

---

## 회신

- OpenAPI를 갱신했는지, 아니면 path가 없어 중단했는지
- `JaHistoryPageResponse` 가 스냅샷에 있는지
- `HistoryResponse`의 `published`, `year`, `month`, `content`가 그대로인지
- Admin이면 `shouldUseJaHistoryRemoteApi`를 켰는지
- Platform이면 공개 GET을 붙였는지, `version`을 빼었는지
- `1920` 문구 철자를 유지했는지
