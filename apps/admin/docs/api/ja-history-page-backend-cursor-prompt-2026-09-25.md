# Cursor prompt — JA History 페이지 API·시드 (JAHOMEADMINBACK)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로는 이 문서만 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/ja-history-page-backend-cursor-prompt-2026-09-25.md`

FE 연동 문서(백엔드 작업 후, 별도 채팅):  
`apps/admin/docs/api/ja-history-page-frontend-cursor-prompt-2026-09-25.md`

**Admin·Platform 프론트 파일은 수정하지 마라.**  
프론트는 path·스키마가 `:8081` `/v3/api-docs`에 보이기 전에는 remote를 켜지 않는다.

---

## 현재 FE 스냅샷 갭 (2026-09-26 확인)

Admin OpenAPI(`openapi/ja-korea.openapi.json` · `openapi/assets.openapi.json`) 기준:

| 항목 | 상태 |
|------|------|
| `AssetPurpose` / `UploadPrepareRequestPurpose` 의 `JA_HISTORY_HERO_IMAGE`, `JA_HISTORY_WORLD_TIMELINE_IMAGE`, `JA_HISTORY_KOREA_TIMELINE_IMAGE`, `JA_HISTORY_LOCKED_MEDIA` | **이미 있음** — 문자열을 rename·삭제하지 마라. 없으면 추가 |
| `GET /api/admin/ja-korea/ja-history` 및 섹션 PUT 8개 | **없음** — 이번에 구현 |
| `GET /api/public/ja-korea/ja-history` | **없음** — 이번에 구현 |
| `JaHistoryPageResponse` 등 `JaHistoryPage*` 스키마 | **없음** — 이번에 추가 |
| `GET/POST /api/admin/ja-korea/history` (연혁·수상·인증 목록) | **이미 있음** — 손대지 마라 |

Admin 화면(`features/ja-history`)은 `shouldUseJaHistoryRemoteApi() && false` 로 localStorage만 쓴다.  
백엔드 path가 OpenAPI에 올라오면 프론트가 별도 작업으로 remote를 켠다.

---

## Goal

Platform `/about/history` 한 페이지를 관리자가 섹션 단위로 저장하고, 로그인 없이 조회할 수 있게 한다.

문서는 싱글톤 1건이다. 목록·페이지네이션·게시 on/off는 없다.

완료 조건:

1. 아래 Admin path와 Public path가 `:8081` `/v3/api-docs`와 실제 HTTP에 있다.
2. components/schemas 에 `JaHistoryPageResponse`(및 관련 `JaHistoryPage*` 요청·미디어 타입)가 있다.
3. 로컬 DB에 이 문서의 시드 문구·고정 id·기간이 있다. 개행을 한 줄로 합치지 마라.
4. 시드는 **idempotent**. 두 번 실행해도 행이 늘지 않는다. TRUNCATE 금지.
5. **local/dev 전용.** prod Flyway·앱 기동이 이 SQL을 자동 실행하지 않는다.
6. 기존 연혁/수상/인증 API는 응답 필드가 이 작업 전과 같다.

---

## Out of scope / 금지

이미 있는 연혁/수상/인증 목록이다. **이 페이지가 아니다.**

- `GET/POST /api/admin/ja-korea/history`
- `GET/PUT/DELETE /api/admin/ja-korea/history/{id}`
- `PATCH /api/admin/ja-korea/history/{id}/published`
- `POST /api/admin/ja-korea/history/bulk-delete`
- `HistoryResponse` (`id`, `published`, `year`, `month`, `content`) 필드 추가·삭제·rename

그 밖에 하지 마라.

- 기간·연도·카드 id를 추가하거나 삭제하는 API
- 잠긴 이미지(연도 그래픽, 배움 사진, 시대 사진, 철학 카드, Thrive 장식, CTA 사진)를 관리자 저장으로 교체
- 히어로·연혁 대표 이미지에 SVG 업로드 허용
- 이미지 바이트 생성. 시드는 asset 키만 연결한다.
- 시드 문구의 오타 `Junior Achivement`를 `Achievement`로 고치기
- Platform·Admin 프론트 수정
- OpenAPI 스키마 이름을 `HistoryResponse` / `BannerResponse`처럼 기존 이름과 겹치게 두기

---

## 1. 리소스

관리자 JWT.

| 용도 | Method | Path |
|---|---|---|
| 페이지 조회 | GET | `/api/admin/ja-korea/ja-history` |
| 히어로 저장 | PUT | `/api/admin/ja-korea/ja-history/hero` |
| JA의 시작 저장 | PUT | `/api/admin/ja-korea/ja-history/origin` |
| 글로벌 히스토리 캡션 저장 | PUT | `/api/admin/ja-korea/ja-history/eras` |
| 글로벌 연혁 저장 | PUT | `/api/admin/ja-korea/ja-history/world-timeline` |
| 한국 연혁 저장 | PUT | `/api/admin/ja-korea/ja-history/korea-timeline` |
| 믿음을 키우는 교육 저장 | PUT | `/api/admin/ja-korea/ja-history/philosophy` |
| Thrive 저장 | PUT | `/api/admin/ja-korea/ja-history/thrive` |
| JA 살펴보기 저장 | PUT | `/api/admin/ja-korea/ja-history/cta` |

공개. 로그인 없음.

`GET /api/public/ja-korea/ja-history`

조회 응답은 섹션 전체와 `updatedAt`, `version`이다.  
PUT body는 해당 섹션과 `version`만 받는다. 저장 성공 시 페이지 전체를 돌려라. `version`이 다르면 409.  
공개 응답은 관리자 조회와 같은 섹션 필드다. `version`은 빼라. 시드가 있으면 200이다.

OpenAPI record DTO에는 `@Schema(name=…)` 로 `JaHistoryPage` 접두사를 붙여라.  
예: `JaHistoryPageResponse`, `JaHistoryPageHeroUpdateRequest`, `JaHistoryPageTimelineUpdateRequest`.

### 미디어

```json
{ "assetId": 1, "fileName": "hero-visual.png", "alt": "JA History 히어로", "url": "https://..." }
```

파일이 오브젝트 스토리지에 없어도 `fileName`과 `alt`는 내려라. `url`만 null이어도 된다. `assetId`가 없으면 null.

### 잠금

아래 미디어는 조회에만 포함하고, PUT body로 받지 마라. 저장 요청에 이 필드가 있어도 무시하고 시드 asset을 유지하라.

| 섹션 | 잠금 |
|---|---|
| origin | `yearMark`, `learningImage` |
| eras | `year`, 각 행 `image`. 캡션만 수정 |
| philosophy | 카드 `id`, 카드 `image` |
| thrive | 카드 `id`, 카드 `decoration` |
| cta | `image` |
| world / korea timeline | `periods[].id`, `periods[].label`, `events[].year` |

기간에 이벤트가 없는 행은 `title: ""`, `events: []` 로 저장·조회하라. 빼지 마라.

이벤트가 있는 기간은 `title`이 필수다. 이벤트가 없는 기간의 `title`은 빈 문자열을 허용한다.

### 필수 텍스트

앞뒤 공백만 있는 값은 400이다. 본문 중간의 빈 줄은 유지하라.

| 섹션 | 필수 |
|---|---|
| hero | 이미지, `eyebrow`, `mainText` |
| origin | `title`, `body`, `learningEyebrow`, `learningTitle`, `learningBody`, `learningOutro`, `learningEmphasis` |
| eras | 연도 4개의 `caption` |
| timeline | 이미지, `title`, `body`, 이벤트가 있는 기간의 `title`, 존재하는 연도 행의 `text` |
| philosophy | `eyebrow`, `title`, `lead`, 카드 4개의 `title`·`description` |
| thrive | `title`, `lead`, `footnote`, 카드 4개의 `title`·`description` |
| cta | `title`, `body`, `primaryLabel`, `primaryHref`, `secondaryLabel`, `secondaryHref` |

알 수 없는 기간 id, 카드 id, 연도, 또는 고정 행 누락은 400이다.

### 이미지 업로드

새 업로드 path를 만들지 마라. 기존 asset `prepareUpload` → 바이너리 업로드 → `confirmUpload`를 재사용하라.

아래 purpose가 enum·검증에 **이미 있으면 유지**하고, 없으면 **추가**만 하라. 기존 purpose 문자열은 바꾸지 마라.

| purpose | 누가 쓰나 | 허용 |
|---|---|---|
| `JA_HISTORY_HERO_IMAGE` | 히어로 PUT의 `imageAssetId` | `image/jpeg`, `image/png`, 최대 15MB |
| `JA_HISTORY_WORLD_TIMELINE_IMAGE` | 글로벌 연혁 PUT | 같음. 권장 크기는 검증하지 마라 (1920×1080, 1440×380은 안내 문구일 뿐) |
| `JA_HISTORY_KOREA_TIMELINE_IMAGE` | 한국 연혁 PUT | 같음 |
| `JA_HISTORY_LOCKED_MEDIA` | 시드 전용 | `prepareUpload`는 400. SVG 포함 |

히어로·연혁 이미지의 `imageAssetId`는 필수이며 null이면 400이다. purpose가 섹션과 다르면 400이다.

---

## 2. 저장 body

공통: `version` (number, 필수).

### hero

`imageAssetId`, `eyebrow`, `mainText`

### origin

`title`, `body`, `learningEyebrow`, `learningTitle`, `learningBody`, `learningOutro`, `learningEmphasis`

### eras

`items`: 길이 4. 각 항목 `year` (`1920` \| `1950` \| `1960` \| `1980`), `caption`

### world-timeline / korea-timeline

`imageAssetId`, `title`, `body`, `periods`

`periods` 항목: `id`, `title`, `events` (`year`, `text`). `label`은 body로 받지 마라. 서버 고정값을 응답에 넣어라.

글로벌 id·label·연도:

| id | label | 시드 연도 |
|---|---|---|
| `1919-1929` | `1919-1929` | `1919`, `1920`, `1929` |
| `1955-1962` | `1955-1962` | 없음 |
| `1969-2000` | `1969-2000` | 없음 |
| `2019-now` | `2019-Now` | 없음 |

한국 id·label·연도:

| id | label | 시드 연도 |
|---|---|---|
| `2002-2006` | `2002-2006` | `2002`, `2003`, `2006` |
| `2007-2015` | `2007-2015` | 없음 |
| `2016-2020` | `2016-2020` | 없음 |
| `2021-now` | `2021-NOW` | 없음 |

### philosophy

`eyebrow`, `title`, `lead`, `cards`

카드 id 순서: `practice`, `role-model`, `mindset`, `support`  
각 카드는 `id`, `title`, `description`만.

### thrive

`title`, `lead`, `footnote`, `cards`

카드 id 순서: `empower`, `digital`, `partner`, `enablers`  
각 카드는 `id`, `title`, `description`만. 장식 SVG는 응답의 `decoration`으로만 내려라.

### cta

`title`, `body`, `primaryLabel`, `primaryHref`, `secondaryLabel`, `secondaryHref`

`primaryHref`·`secondaryHref`는 사이트 경로 문자열이다. 시드는 `/programs`, `/impact`.

---

## 3. 로컬 시드

스크립트: `scripts/seed_ja_history_page_local.sql`

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_ja_history_page_local.sql
```

1. 싱글톤이 없으면 INSERT, 있으면 아래 텍스트와 고정 행만 UPDATE. 관리자가 이미 고친 문구를 이 스크립트가 덮어쓴다. local/dev 전용이라고 스크립트 머리에 적어라.
2. 이미지 바이트는 만들지 마라. `storage_key`는 `local/seed/ja-history/<fileName>`. purpose는 잠금 파일이면 `JA_HISTORY_LOCKED_MEDIA`, 히어로·연혁 대표는 위 표의 purpose.
3. 같은 `storage_key`가 있으면 그 asset id를 재사용하라.
4. 기존 `ja_korea_history` (연혁/수상/인증) 테이블은 읽지도 쓰지도 마라.
5. `\n`은 실제 개행이다. 빈 줄도 유지하라.

### 잠금 파일

| fileName | alt |
|---|---|
| `year-1919.svg` | 빈 문자열 |
| `learning-photo.png` | `방과후 교실에서 기계를 다루며 배우는 청소년들` |
| `era-1920.png` | `1920년대 스프링필드 Trade Fair에 전시된 모자와 상품` |
| `era-1950.png` | `1950년대 JA Company Program Trade Fair에서 수상하는 학생들` |
| `era-1960.png` | `1960년대 JA 학생 기업이 상품을 선보이는 모습` |
| `era-1980.png` | `1980년대 인디애나폴리스 JA 응용경제학 교육 현장` |
| `philosophy-practice.png` | `헤드셋을 착용하고 미소 짓는 청소년` |
| `philosophy-role-model.png` | `함께 웃고 있는 청소년들` |
| `philosophy-mindset.png` | `미소 짓는 두 명의 청소년` |
| `philosophy-support.png` | `창가에서 앞을 바라보는 청소년` |
| `thrive-empower.svg` | 빈 문자열 |
| `thrive-digital.svg` | 빈 문자열 |
| `thrive-partner.svg` | 빈 문자열 |
| `thrive-enablers.svg` | 빈 문자열 |
| `cta-photo.png` | `함께 웃고 있는 여러 명의 어린이` |

교체 가능한 시드 파일:

| 섹션 | fileName | alt |
|---|---|---|
| hero | `hero-visual.png` | `JA History 히어로` |
| world timeline | `expansion-photo.png` | `테이블에 둘러앉아 함께 활동하는 JA 청소년들` |
| korea timeline | `korea-photo.png` | `교실에서 함께 활동하는 JA Korea 교육 현장` |

### hero

- `eyebrow`: `JA History`
- `mainText`:

```
BOUNDLESS YOUTH;
THRIVING COMMUNITIES
```

### origin

- `title`:

```
A WORLD OF POSSIBILITIES
청소년을 위한 100년의 여정
```

- `body`:

```
처음 JA의 교육은 학생들이 비즈니스 자원봉사자들의 지도 아래 직접 기업을
운영해보는 방과후 프로그램(Company Program)으로 시작했습니다.
그리고 100년이 지난 오늘날, JA는 100여 개 회원국으로 구성된 네트워크를 통해 매년
2천만 명 이상의 청소년에게 진로·취업, 경제·금융, 기업가정신 교육을 제공하고 있습니다.

규모와 교육의 방식은 달라졌지만, 모든 청소년에게 자신의 미래와 공동체를 변화시킬
무한한 가능성이 있다는 믿음은 변함없이 이어지고 있습니다.
```

- `learningEyebrow`: `LEARNING BY DOING`
- `learningTitle`: `배움에서 실천으로`
- `learningBody`:

```
1919년 미국에서 8세부터 12세까지의 어린이에게 비즈니스를 가르치는 방과후교실이 시작됐습니다.
이 조직은 이듬해 Junior Achievement라는 이름을 갖게 되었습니다.

1929년 JA에 참여한 청소년들은 실제 상품과 서비스를 판매하는 회사를 만들기 시작했습니다.
교실에서 경제를 배우는 데 그치지 않고, 직접 아이디어를 내고 자금을 마련하며 상품을 생산하고
판매하면서 경제가 움직이는 방식을 배웠습니다.
```

- `learningOutro`:

```
이 때 자리 잡은 Learning by Doing, ‘직접 해보며 배우는 교육’은 지금까지도 JA의 체험형 교육으로 이어지고 있습니다. 청소년은 팀을 이뤄 자신의 아이디어를 실제 행동으로 옮깁니다.
결과가 기대와 달라도 방법을 바꿔 다시 시도합니다. 이 과정에서 지식을 습득하는 것은 물론, 도전하는 태도와 책임감, 회복력, 문제해결 능력을 함께 키웁니다.
```

- `learningEmphasis`:

```
직접 해보는 경험이
스스로를 믿는 힘이 됩니다.
```

### eras caption

| year | caption |
|---|---|
| 1920 | `미국 메사추세츠 스프링필드에서 열린\nTrade Fair에 모자를 비롯한 상품들이 전시되어 있다.` |
| 1950 | `JA Company Program의 Trade Fair에 참여한 학생들이 수상하고 있다.` |
| 1960 | `JA를 통해 성장한 학생 기업이 자신들의 상품을 선보이고 있다.` |
| 1980 | `인디애나폴리스에서 JA의 응용경제학 교육 프로그램이 진행되고 있다.` |

### world timeline

- `title`:

```
세상이 바뀔 때마다
JA의 교육도 진화했습니다.
```

- `body`:

```
새로운 산업이 등장하고 일하는 방식이 바뀔 때마다 청소년에게
필요한 역량도 달라졌습니다. JA는 교육의 대상과 방법, 활동 지역을 끊임없이 확장해 왔습니다. 그러나 청소년에게 경험을 제공하고
스스로 미래를 만들어 갈 힘을 길러준다는 원칙은 한 세기 넘게
이어지고 있습니다.
```

| id | title | year | text |
|---|---|---|---|
| `1919-1929` | `청소년 비즈니스 교육의 시작` | `1919` | `방과후교실에서 비즈니스 교육 시작` |
| `1919-1929` | 같은 제목 | `1920` | `Junior Achivement로 이름 변경` |
| `1919-1929` | 같은 제목 | `1929` | `실물 창업에 기반한 기업가정신 교육 진행` |
| `1955-1962` | 빈 문자열 |  | 이벤트 없음 |
| `1969-2000` | 빈 문자열 |  | 이벤트 없음 |
| `2019-now` | 빈 문자열 |  | 이벤트 없음 |

`Junior Achivement` 철자를 유지하라.

### korea timeline

- `title`:

```
전 세계가 함께하는 배움이
2002년 한국의 교실에 닿았습니다
```

- `body`:

```
2002년 10월, 청소년 교육 NGO JA Korea가 설립됐습니다.
JA Korea는 JA의 체험형 교육을 한국 학교 현장에 맞게 발전시키며 진로·취업, 경제·금융, 기업가정신, 디지털 리터러시 분야의 교육을
제공해 왔습니다. 또한 JA Global Network가 공유하는 교육
철학은 유지하면서, 한국이 마주한 현실과 학교 현장의 필요에 맞춰 새로운 콘텐츠를 개발 및 보급하고 있습니다.
```

| id | title | year | text |
|---|---|---|---|
| `2002-2006` | `한국에서 시작된 JA 교육` | `2002` | `JA Korea 설립 (초대 이사장 강경식 전 부총리)` |
| `2002-2006` | 같은 제목 | `2003` | `JA 초등 경제교육 프로그램 한국화, 청소년 진로 프로그램 개발` |
| `2002-2006` | 같은 제목 | `2006` | `2006년 대학생경제교육봉사단 UJAT 출범\n고등학교 대상 글로벌 기업가정신 교육 프로그램 운영` |
| `2007-2015` | 빈 문자열 |  | 이벤트 없음 |
| `2016-2020` | 빈 문자열 |  | 이벤트 없음 |
| `2021-now` | 빈 문자열 |  | 이벤트 없음 |

### philosophy

- `eyebrow`: `LEARNING BY DOING`
- `title`:

```
‘나는 할 수 있다’는
믿음을 키우는 교육
```

- `lead`:

```
JA가 추구하는 변화의 중심에는 자기효능감(Self-efficacy)이 있습니다.
자기효능감은 새로운 문제를 만났을 때, 스스로 해낼 수 있다고 믿고 실제 행동으로 옮기는 힘입니다.
정답을 알려주는 대신 청소년이 직접 시도하고 실패에서 배우며 더 나은 방법을 찾을 수 있도록 돕습니다.
```

| id | title | description |
|---|---|---|
| `practice` | `직접 해보며 익힙니다` | `실제 환경과 유사한 체험 활동으로 새로운 기술과 문제 해결 방법을 배웁니다.` |
| `role-model` | `롤 모델을 만납니다` | `교사, 기업인, 봉사자, 멘토의 경험을 통해 자신의 미래를 구체적으로 상상합니다.` |
| `mindset` | `긍정적으로 사고합니다` | `부정적인 생각에 머무르지 않고, 다음 도전으로 이어갈 수 있는 회복력을 기릅니다.` |
| `support` | `믿음과 지지를 경험합니다` | `자신의 가능성을 믿어주는 사람들의 응원 속에서 더 큰 도전을 시작합니다.` |

### thrive

- `title`:

```
Thrive:
2050년을 향한 JA의 발걸음
```

- `lead`:

```
기술이 빠르게 발전함에 따라 교육과 일의 방식이 달라지고 있습니다.
JA Worldwide는 2026-2028 글로벌 전략 Thrive를 기반으로 더 많은 청소년에게 교육의 기회를 제공하고,
디지털 기술을 적극적으로 활용하며, 파트너십을 통해 더 큰 임팩트를 만들어 갈 예정입니다
```

마지막 줄 끝의 마침표는 없다. 그대로 둬라.

- `footnote`:

```
JA는 2050년까지 청소년에게 연간 1억 건의 학습 경험을 제공하고, 측정 가능한 형태의 변화를 창출해 번영하는 공동체를 만드는 것을 장기 목표로 삼아 오늘도
전 세계 100여 개 국가에서 청소년을 교육하고 있습니다.
```

| id | title | description |
|---|---|---|
| `empower` | `EMPOWER YOUTH EVERYWHERE` | `더 많은 지역의 청소년에게 배움의 기회를 전합니다.` |
| `digital` | `ACCELERATE DIGITAL` | `AI와 디지털 기술을 활용해 새로운 교육 경험을 만듭니다.` |
| `partner` | `PARTNER FOR IMPACT` | `학교, 기업, 정부, 지역사회가 협력해 지속가능한 변화를 만듭니다.` |
| `enablers` | `STRATEGIC ENABLERS` | `데이터 기반 의사결정, 이해관계자 참여 및 AI 자동화 활용, 회원국 성장 단계별 지원을 통해 청소년 교육의 기반을 강화합니다.` |

### cta

- `title`:

```
청소년이 가진
무한한 잠재력을 믿습니다
```

- `body`: `JA Korea는 앞으로도 청소년이 실제 삶과 연결된 교육을 통해 스스로 선택하고 도전할 수 있도록 돕겠습니다. 학교, 기업, 강사, 봉사자, 지역사회 등 다양한 교육 파트너와 협력해 더 많은 청소년에게 배움의 기회를 전하겠습니다.`
- `primaryLabel`: `교육 프로그램 살펴보기`
- `primaryHref`: `/programs`
- `secondaryLabel`: `JA Impact 살펴보기`
- `secondaryHref`: `/impact`

---

## Done when

회신에 아래를 채워라.

- `:8081` `/v3/api-docs`에 `GET /api/admin/ja-korea/ja-history`, 섹션 PUT 8개, `GET /api/public/ja-korea/ja-history` 가 있는지
- `JaHistoryPageResponse`(또는 동등한 `JaHistoryPage*` 관리자 응답)가 components/schemas 에 있는지
- `GET /api/public/ja-korea/ja-history` 상태 코드 (시드 후 200, `version` 없음)
- `GET /api/admin/ja-korea/ja-history` 에 `version`·`updatedAt` 이 있는지
- `hero.mainText`에 개행이 있는지
- `worldTimeline.periods` 길이 4, `1919-1929` 이벤트 3, `1955-1962.events` 길이 0
- `1920` 이벤트 text가 `Junior Achivement로 이름 변경` 인지
- `koreaTimeline` `2006` text에 개행이 있는지
- `PUT /api/admin/ja-korea/ja-history/hero`에 `imageAssetId` 없이 보내면 400인지
- stale `version` PUT 이 409인지
- `prepareUpload` purpose `JA_HISTORY_LOCKED_MEDIA`가 400인지
- `GET /api/admin/ja-korea/history` 목록 항목 필드가 작업 전과 같은지 (`published`, `year`, `month`, `content`)
- 시드 SQL을 두 번 실행했을 때 기간 행 수가 늘지 않는지

프론트 쪽 다음 단계(이 채팅에서 하지 마라): Admin `fetch:openapi` → `generate:api` → `shouldUseJaHistoryRemoteApi` 의 `&& false` 제거.
