# Cursor prompt — 임팩트 스토리 Platform 18건 시드 + 공개 목록 `q`

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약·파일 경로만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·HTML sanitize)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/impact-story-platform-seed-backend-cursor-prompt-2026-09-20.md`

---

## Goal

Platform 사용자 홈·임팩트 스토리 화면이 아래 공개 API를 호출한다.

| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/public/impact-story/categories` | 탭 라벨 |
| GET | `/api/public/impact-story/stories` | 목록·캐러셀·홈 서브카드 |
| GET | `/api/public/impact-story/stories/{id}` | 상세 |
| GET | `/api/public/main` | 홈 대표 스토리 1건 + YouTube (기존 유지) |

로컬/dev DB를 **Platform mock 18건**과 같은 제목·카테고리·게시일·이미지로 맞춰라.  
Admin JWT CRUD 경로는 이미 있다. 이번 작업은 **시드 + 공개 목록 검색 `q`**.

완료 조건:

1. 카테고리 5이름(스토리 / 언론보도 / 보고서 / 영상 / 뉴스레터)이 있다. `sortOrder` 1–5. 기존 행이 있으면 id 유지.
2. published 스토리 **18건**. 제목·카테고리·`publishAt`이 아래 표와 같다. 예전 Admin mock 12건 카피는 없다.
3. `pinned=true` 는 표의 1·2·3번만. pin 상한 9를 넘기지 마라.
4. 각 스토리 `imageUrl` 이 실 PNG를 가리키고 HTTP 200 + `image/*` 이다. `impact-story-placeholder.png` · `localhost:9000` 직접 URL 금지.
5. 본문 `body` 는 요약 HTML 1단락 + 커버 이미지. Admin 에디터·Platform `RichTextViewer`가 읽을 수 있다.
6. `GET /api/public/main` 의 `impact.featuredStory` 는 **2번(민재)** 스토리다. 커버는 `card-minjae.png`.
7. `GET /api/public/impact-story/stories?q=` 제목 contains (trim, 빈값 무시). `page`/`size` 와 같이 쓴다.
8. 목록 정렬: **pinned 우선, 그다음 `publishAt` desc**.
9. 시드는 **idempotent**. 재실행해도 18건·pin 3이 중복되지 않는다.
10. **local/dev 전용.** prod Flyway에 운영 카피를 넣지 마라. 앱 기동·Flyway repeatable이 이 SQL을 **자동 재실행하지 않는다.**
11. 작업 후 프론트 변경이 있으면 아래 템플릿으로 회신하라.

---

## Out of scope / 금지

- 테이블 **TRUNCATE**. 시드 제목과 다른 운영/수동 행은 남겨라.
- `impact-story-placeholder.png` 파일명·키
- `publicUrl` 에 `localhost:9000` MinIO 직접 주소
- Admin FE localStorage mock 수정 (프론트 작업 아님)
- 공개 목록 `size` default를 20이 아닌 값으로 올리기
- CMS 공지 API 프록시
- 홈 `GET /api/public/main` 필드 추가·삭제 (featuredStory FK만 민재로 연결)

---

## 시드 초기화

기존 스크립트: `scripts/seed_impact_stories_local.sql`, `scripts/seed_impact_story_categories_local.sql`.

1. 카테고리 5이름은 **없으면 INSERT, 있으면 id 유지**.
2. 아래 **시드 제목 집합**(신규 18 + 구 Admin 12의 잔여)에 해당하는 스토리 행만 DELETE. 그 외 행은 실제 데이터로 본다.
3. **TRUNCATE 금지.**
4. 로컬 compose / Flyway repeatable / README 기본 시드에서 위 SQL **자동 실행을 제거**한다. 더미가 다시 필요하면 `scripts/seed_impact_stories_local.sql` 을 **명시 실행 전용**으로 둔다.

구 Admin 시드 잔여 제목(18건에 없는 것, 있으면 삭제):

- `창업놀이 페스티벌 2022 최종 선정팀 결과발표`
- `청소년 금융 리터러시 캠페인 참여 기관 모집 (비공개)`

---

## 카테고리 5

| sortOrder | name |
|-----------|------|
| 1 | 스토리 |
| 2 | 언론보도 |
| 3 | 보고서 |
| 4 | 영상 |
| 5 | 뉴스레터 |

공개 응답: `{ id, name }`. Platform은 `name` 으로 탭 키를 매핑한다. 이름을 바꾸지 마라.

---

## 에셋 파일 (프론트 레포에서 복사)

`homepage_asset` 에 올리고 `READY` 로 둔 뒤 스토리 `imageUrl` / 첨부 FK에 연결하라.  
placeholder 1장 재사용을 **중단**하라.

프론트 레포 `jakorea` 기준:

```
apps/platform/src/features/impact-story/image/illustration/card-metlife.png
apps/platform/src/features/impact-story/image/illustration/card-minjae.png
apps/platform/src/features/impact-story/image/illustration/featured-metlife.png
apps/platform/src/features/impact-story/image/illustration/card-dream-stage.png
apps/platform/src/features/impact-story/image/illustration/card-archery.png
apps/platform/src/features/impact-story/image/illustration/card-kids-finance.png
apps/platform/src/features/impact-story/image/illustration/card-mentee-supporter.png
apps/platform/src/features/impact-story/image/illustration/card-samil-class.png
apps/platform/src/features/impact-story/image/illustration/card-samil-teacher.png
apps/platform/src/features/impact-story/image/illustration/card-coy.png
```

권장 저장 경로 예:

```
local/seed/impact-story/card-metlife.png
local/seed/impact-story/card-minjae.png
local/seed/impact-story/featured-metlife.png
local/seed/impact-story/card-dream-stage.png
local/seed/impact-story/card-archery.png
local/seed/impact-story/card-kids-finance.png
local/seed/impact-story/card-mentee-supporter.png
local/seed/impact-story/card-samil-class.png
local/seed/impact-story/card-samil-teacher.png
local/seed/impact-story/card-coy.png
```

1번 스토리 목록 썸네일 = `card-metlife.png`. 캐러셀용 크롭이 따로 있으면 `featured-metlife.png` 를 같은 스토리에 연결.  
공개 `imageUrl` 1개만 있으면 `card-metlife.png` 로 통일해도 된다.

---

## 스토리 18건

SSOT: Platform `apps/platform/src/features/impact-story/lib/mock-stories.ts` `SEED`.  
전부 `published=true`. `authorName` 예: `홍길동` / `김지은` / `이준호` 순환.

`publishAt` 은 표의 ISO를 그대로 저장하라 (날짜만 있고 시각이 없으면 `00:00:00Z`).

본문 `body` 최소 형식:

```html
<p>{summary}</p>
<p><img src="{이 스토리 imageUrl}" alt=""></p>
```

| # | pinned | category | publishAt | title | summary | image |
|---|--------|----------|-----------|-------|---------|-------|
| 1 | true | 스토리 | 2026-08-15T00:00:00.000Z | 메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울 “금융교육” | 지난 5월 16~17일 열린 Better Ground DAY 1박2일 캠프 현장에 반가운 얼굴이 나타났습니다. 바로 ‘Better Ground 1기’로 참여했던 이... | card-metlife.png |
| 2 | true | 스토리 | 2026-08-08T00:00:00.000Z | 14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유 | 2012년 고등학생 신분이었던 민재님은 친구들과 함께 FedEx/JA International Trade Challenge에 도전했습니다. 14년이 지난 지금... | card-minjae.png |
| 3 | true | 언론보도 | 2026-08-01T00:00:00.000Z | JA Korea - 시립은평청소년미래진로센터(궁리하다) 업무 협약 | JA Korea와 시립은평청소년미래진로센터가 청소년 진로·금융교육 확산을 위한 업무 협약을 체결했습니다. | card-dream-stage.png |
| 4 | false | 스토리 | 2026-07-28T00:00:00.000Z | 창업놀이 페스티벌 2026 최종 선정팀 결과발표 | 창업놀이 페스티벌에 참여한 청소년 팀들의 열정과 아이디어를 소개합니다. | card-archery.png |
| 5 | false | 보고서 | 2026-07-20T00:00:00.000Z | 경제금융교육 커리큘럼 개편 안내 | 현장 피드백을 반영한 경제금융교육 커리큘럼 개편 내용을 공유합니다. | card-kids-finance.png |
| 6 | false | 뉴스레터 | 2026-07-12T00:00:00.000Z | 연례 후원자 보고회 하이라이트 | 한 해 동안의 교육 성과와 후원 성과를 나누는 보고회 소식을 전합니다. | card-mentee-supporter.png |
| 7 | false | 스토리 | 2026-07-05T00:00:00.000Z | FedEx/JA International Trade Challenge 후기 | 국제 무역 챌린지에 도전한 학생들의 생생한 현장 이야기를 담았습니다. | card-samil-class.png |
| 8 | false | 언론보도 | 2026-06-28T00:00:00.000Z | 언론보도 스크랩 — JA 교육 프로그램 | 최근 언론에 소개된 JA Korea 교육 프로그램 소식을 모아 보았습니다. | card-samil-teacher.png |
| 9 | false | 보고서 | 2026-06-20T00:00:00.000Z | 분기 보고서 발간 안내 | 2026년 2분기 활동과 성과를 담은 보고서를 공개합니다. | card-coy.png |
| 10 | false | 영상 | 2026-06-12T00:00:00.000Z | 영상 콘텐츠: JA 캠퍼스 투어 | JA Korea 교육 현장을 영상으로 만나보세요. | card-metlife.png |
| 11 | false | 스토리 | 2026-06-05T00:00:00.000Z | 자원봉사자 인터뷰 — 함께 성장하는 한 해 | 교육 현장에서 청소년과 함께한 자원봉사자들의 이야기를 소개합니다. | card-minjae.png |
| 12 | false | 뉴스레터 | 2026-05-28T00:00:00.000Z | JA Korea 6월 뉴스레터 | 이번 달 주요 프로그램과 참여 소식을 뉴스레터로 전해 드립니다. | card-dream-stage.png |
| 13 | false | 스토리 | 2026-05-20T00:00:00.000Z | 신규 지회 개소식 스토리 | 새롭게 문을 연 지회에서 청소년들과 나눈 첫 만남 이야기입니다. | card-archery.png |
| 14 | false | 언론보도 | 2026-05-12T00:00:00.000Z | 청소년 금융 리터러시 캠페인 참여 기관 모집 | 금융 리터러시 확산을 위한 캠페인에 함께할 기관을 모집합니다. | card-kids-finance.png |
| 15 | false | 영상 | 2026-05-08T00:00:00.000Z | Better Ground DAY 하이라이트 영상 | 1박2일 캠프의 열기와 배움의 순간을 영상으로 담았습니다. | card-mentee-supporter.png |
| 16 | false | 보고서 | 2026-04-30T00:00:00.000Z | 2025 연차보고서 하이라이트 | 한 해의 교육 임팩트를 한눈에 볼 수 있는 연차보고서 핵심을 소개합니다. | card-samil-class.png |
| 17 | false | 스토리 | 2026-04-22T00:00:00.000Z | 교실 속 기업가정신 — 선생님과 학생의 이야기 | 기업가정신 수업을 통해 달라진 교실의 풍경을 전합니다. | card-samil-teacher.png |
| 18 | false | 뉴스레터 | 2026-04-15T00:00:00.000Z | JA Korea 봄호 뉴스레터 | 봄을 맞아 새롭게 열린 프로그램과 참여 안내를 모았습니다. | card-coy.png |

홈 대표: 2번 제목 `14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유` 의 **숫자 id** 를 `main_*_content_setting.featured_story_id` (또는 동등 컬럼)에 넣어라.  
공개 `impact.featuredStory.id` 가 그 숫자와 같아야 한다.

---

## 공개 목록 `q` (필수)

`GET /api/public/impact-story/stories`

기존 query: `categoryId`(optional) · `page`(default 0) · `size`(default 20).

추가:

| name | required | 의미 |
|------|----------|------|
| `q` | 아니오 | 제목 contains. trim 후 빈 문자열이면 필터 없음. 대소문자 무시. |

Platform 목록 그리드는 `size=9`, `page` 0-based. `totalCount` / `totalPages` 는 **필터 적용 후** 전체.

선택: item에 `summary` 문자열. 없어도 Platform 카드는 제목·날짜·이미지만 쓴다. 있으면 캐러셀 요약에 쓴다. 시드 summary를 넣으면 캐러셀이 비지 않는다.

검수:

```text
GET /api/public/impact-story/categories
→ 5건, name 이 위 표와 동일

GET /api/public/impact-story/stories?page=0&size=9
→ items 9, totalCount 18, totalPages 2
→ items[0..2].pinned == true (정렬이 pinned 우선이면)

GET /api/public/impact-story/stories?q=민재
→ 2번 스토리가 포함. totalCount >= 1

GET /api/public/impact-story/stories/{민재 id}
→ title 일치, body 비어 있지 않음, imageUrl HTTP 200

GET /api/public/main
→ impact.featuredStory.title 에 민재, imageUrl 에 placeholder 없음
```

---

## 작업 후 회신

```text
- 변경 파일:
- 시드 DELETE 대상 (제목/키):
- TRUNCATE 사용 여부: (없어야 함)
- 자동 재시드 제거 여부:
- published 18 / pinned 3 / categories 5:
- featuredStoryId (숫자):
- q 지원 여부:
- summary 필드 여부:
- OpenAPI 갱신 여부:
```

그리고 **프론트 변경이 필요하면** 아래 블록을 **그대로 채워** 회신하라.  
path·item 필드가 그대로고 `q` 만 추가되며 Platform이 이미 `q` 를 보내면 `프론트 Cursor 프롬프트: 불필요` 한 줄.

---

## 프론트 Cursor 프롬프트 템플릿 (백엔드가 채워 회신)

````text
# Cursor prompt — Platform 임팩트 스토리 (시드·q 반영 후)

대상: 프론트 레포 `jakorea`, 앱 `apps/platform` · `apps/admin`.
백엔드가 Platform 18건을 시드하고 공개 목록 `q` 를 넣는다. **추측하지 말고 아래 계약만** 반영하라.

## 하지 마라

- mock store 제거 (Homepage API 미설정·실패 fallback 유지)
- Admin list `size` 를 20 초과로 올리기
- CMS 공지 API 연동

## 1. OpenAPI (스펙이 바뀐 경우만)

백엔드 스펙 경로: {BE OpenAPI 파일}
추가·변경 요약:
- {없으면 none}

## 2. 매퍼

파일:
- `apps/platform/src/features/impact-story/api/mappers.ts`

백엔드 실제 값: `{q / summary / body 포맷}`

## 3. 검증

- Platform `/impact` 탭·검색·9건 페이징
- `/impact/{id}` 본문 RichTextViewer
- 홈 서브카드 3 + public main 민재 히어로
- Admin JWT 목록 18건, pin 3

## 작업 후 회신

- 변경 파일:
- OpenAPI 재생성 여부:
````

**Last updated:** 2026-09-20
