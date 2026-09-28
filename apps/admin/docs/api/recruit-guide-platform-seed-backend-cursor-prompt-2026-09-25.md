# Cursor prompt — 채용 안내 Platform SSOT 시드 (JAHOMEADMINBACK)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로는 이 문서만 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(길이·NOT NULL·enum)만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md`

값의 기준은 Platform 채용 안내 상수다. Admin mock·이전 합본 시드 문서는 SSOT가 아니다.  
이전 합본(`recruit-platform-seed-backend-cursor-prompt-2026-09-25.md`)과 안내 문구가 다르면 **이 문서의 JSON을 따른다.**

Flyway `V22__careers.sql` 과 기존 `scripts/seed_careers_local.sql` 은 이미 `ja_cms_local` 에 있다.  
이번 작업은 **채용 안내(배너·조직문화·인터뷰)만** 그 값으로 다시 맞춘다. 테이블·API를 새로 만들지 마라.

---

## Goal

로컬/dev Homepage DB의 채용 안내가 Platform `/about/careers` 히어로·조직문화·직무 인터뷰와 같게 한다.

| 화면 | Admin | Public |
|------|-------|--------|
| 채용 안내 | `GET /api/admin/careers/guide` | `GET /api/public/careers/guide` |

완료 조건:

1. 무토큰 `GET /api/public/careers/guide` 가 아래 JSON과 **문자 단위 동일**하다. `mainText`·`subTextKo` 의 `\n` 은 실제 개행이다.
2. `cultureItems` 길이 **4**. 첫 `code` 는 `MAKE_AN_IMPACT`. `displayOrder` 는 1→4.
3. `interviews` 길이 **3**. 첫 `storyKey` 는 `story-metlife-2026`, `year` 는 `2026`.
4. 시드는 **idempotent UPDATE**. 조직문화 4행·인터뷰 3행을 늘리거나 줄이지 않는다. TRUNCATE 금지.
5. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL을 자동 실행하지 않는다.
6. Admin/Platform 프론트 파일은 수정하지 않는다.

---

## Out of scope / 금지

- 채용공고 `job-1`…`job-10` 재시드·삭제. 인재 지원자 INSERT.
- 조직문화 행 추가·삭제. 인터뷰를 3건이 아닌 다른 `storyKey`·제목으로 바꾸기.
- 배너·커버 **파일 바이트** 생성. `storage_key` 만 연결한다. 파일이 없어도 키는 둔다.
- `bannerImageUrl` / `coverImageUrl` 컬럼에 `http://localhost:9000/...` 를 저장. 공개 URL은 조회 시 storage key에서 만든다.
- 배너를 Unsplash URL로 두기.
- 히어로 라벨 `인재채용`, `imageAlt`, `How We Thrive`, thrive `tone` / `column` / decoration SVG, 인터뷰 `categoryLabel` `스토리` 를 DB 컬럼으로 추가. Platform 고정 카피다.
- 조직문화 `title`·`description` 에 화면 줄바꿈(`summaryLines` / `detailLines`)을 `\n` 으로 넣기. 그 필드는 **한 문장**이다.
- 인터뷰 `year` 에 월·일(`2026년 08월 15일`)을 넣기. 연도 정수만.
- 안내 `PUT` API, DTO, OpenAPI 변경.
- 공고 29건, 지원자 `홍길동`.

---

## 시드 규칙

스크립트: `scripts/seed_careers_guide_local.sql`  
없으면 이 이름으로 만든다. 기존 `scripts/seed_careers_local.sql` 의 **안내 UPDATE 구간만** 이 JSON으로 바꿔도 된다. 그 스크립트의 공고·지원자 구간은 실행하지 마라.

1. 안내 싱글톤 행이 없으면 실패로 보고하고 INSERT하지 마라. `V22` 가 만든다.
2. 조직문화는 `code` 로 UPDATE만. `MAKE_AN_IMPACT` · `KEEP_LEARNING` · `SPEAK_OPENLY` · `READY_TO_HELP` 중 없으면 실패로 보고한다.
3. 인터뷰는 `story_key` 로 UPDATE만. `story-metlife-2026` · `story-summer-camp` · `story-volunteer-day` 중 없으면 실패로 보고한다.
4. 배너 asset은 `storage_key = local/seed/careers-hero.png`, purpose `CAREERS_HERO`. 없으면 INSERT, 있으면 그 id를 배너에 연결한다. status `READY`.
5. 인터뷰 커버는 3행이 같은 asset. `storage_key = local/seed/careers-story-metlife.png`, purpose `CAREERS_STORY`.
6. 안내·문화·인터뷰 시드 행 `version = 0`. 문화 행에 version 컬럼이 없으면 만들지 마라.
7. 스크립트를 두 번 실행해도 문화 4, 인터뷰 3, 공고 건수, 지원자 건수가 그대로다.

실행:

```bash
docker exec -i jaback-postgres-1 \
  psql -U ja_cms -d ja_cms_local < scripts/seed_careers_guide_local.sql
```

---

## SEED_DATA

`mainText`·`subTextKo` 의 `\n` 은 SQL에서 실제 개행(`E'...\n...'`)으로 저장한다.

```json
{
  "banner": {
    "storageKey": "local/seed/careers-hero.png",
    "purpose": "CAREERS_HERO",
    "mainText": "가능성을 믿는 사람들이\n만드는 변화, 우리는 청소년의\n가능성을 믿습니다",
    "subTextKo": "신뢰와 존중을 바탕으로 함께 배우고 성장하며,\n그 가능성을 현실로 만들어갑니다.",
    "subTextEn": "People who believe in young people, creating impact together through trust, partnership, and continuous learning."
  },
  "cultureItems": [
    {
      "displayOrder": 1,
      "code": "MAKE_AN_IMPACT",
      "label": "Make an Impact",
      "title": "청소년의 성장이라는 공동의 목적을 향해 함께 나아갑니다",
      "description": "각자의 노력이 만드는 작은 변화가 더 큰 사회적 가치로 이어진다고 믿으며, 맡은 일에 책임감을 가지고 긍정적인 변화를 만들어갑니다."
    },
    {
      "displayOrder": 2,
      "code": "KEEP_LEARNING",
      "label": "Keep Learning",
      "title": "배움은 성장의 시작입니다",
      "description": "호기심을 가지고 새로운 것에 도전하며 끊임없이 배우고 더 나은 방법을 함께 찾아갑니다."
    },
    {
      "displayOrder": 3,
      "code": "SPEAK_OPENLY",
      "label": "Speak Openly",
      "title": "좋은 아이디어는 열린 소통에서 시작됩니다",
      "description": "신뢰와 정직을 바탕으로 자유롭게 의견을 나누며, 직급이나 역할에 관계없이 서로의 목소리에 귀 기울이고 더 나은 방향을 함께 만들어갑니다."
    },
    {
      "displayOrder": 4,
      "code": "READY_TO_HELP",
      "label": "Ready to Help",
      "title": "협력은 서로를 존중하는 마음에서 시작됩니다",
      "description": "다양한 의견에 귀 기울이고, 도움이 필요한 순간에는 기꺼이 손을 내밀며 함께 해결책을 찾아갑니다."
    }
  ],
  "interviews": [
    {
      "displayOrder": 1,
      "storyKey": "story-metlife-2026",
      "title": "메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울",
      "year": 2026
    },
    {
      "displayOrder": 2,
      "storyKey": "story-summer-camp",
      "title": "청소년과 함께한 JA Korea 여름 캠프 이야기",
      "year": 2025
    },
    {
      "displayOrder": 3,
      "storyKey": "story-volunteer-day",
      "title": "임직원 봉사로 이어진 따뜻한 하루",
      "year": 2025
    }
  ],
  "interviewCover": {
    "storageKey": "local/seed/careers-story-metlife.png",
    "purpose": "CAREERS_STORY"
  }
}
```

공개 JSON 필드명: `mainText`, `subTextKo`, `subTextEn`, `bannerImageUrl`, `cultureItems[].code|label|title|description`, `interviews[].storyKey|title|year|coverImageUrl`.  
`bannerImageUrl`·`coverImageUrl` 은 응답에서 storage key가 풀린 URL이면 된다. DB에는 key만 둔다.

---

## 검증

```bash
curl -s http://localhost:8081/api/public/careers/guide
```

기대:

- `mainText` 에 개행 2개. 첫 줄 `가능성을 믿는 사람들이`.
- `subTextKo` 에 개행 1개.
- `subTextEn` 은 한 줄. 개행 없음.
- `cultureItems` 4. 순서 `MAKE_AN_IMPACT`, `KEEP_LEARNING`, `SPEAK_OPENLY`, `READY_TO_HELP`.
- `cultureItems[0].title` 에 `\n` 없음.
- `interviews` 3. 첫 `storyKey` `story-metlife-2026`, `year` 숫자 `2026`.
- 배너 URL 경로에 `local/seed/careers-hero.png`.
- 공고 건수·지원자 건수는 이 스크립트 전과 같다.

문화·인터뷰 `title` 이 위 JSON과 한 글자라도 다르면 시드를 다시 UPDATE하고 curl로 재확인한다.

---

## 회신 템플릿

```text
## 한 일
- 스크립트:
- 실행한 DB:

## 검증
- mainText 개행 수:
- culture codes:
- interview storyKey / year:
- 배너 storage key:
- 공고 건수 변화:
- 지원자 건수 변화:

## 하지 않은 일
- 프론트 수정 없음
- 공고·지원자 시드 없음
- 파일 바이트 생성 없음
- API/DTO 변경 없음

## 막힌 점
- (없으면 없음)
```

**Last updated:** 2026-09-25
