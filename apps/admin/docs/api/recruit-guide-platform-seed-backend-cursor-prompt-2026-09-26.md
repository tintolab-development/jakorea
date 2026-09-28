# Cursor prompt — 채용 안내 Platform SSOT 시드 (텍스트 + 실파일)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서 실행**하라.  
프론트 레포를 탐색하지 마라. 값·경로·해시는 이 문서만 사용하라.  
질문이 필요하면 스키마·asset purpose·MinIO가 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/recruit-guide-platform-seed-backend-cursor-prompt-2026-09-26.md`

값의 기준은 Platform `/about/careers` 히어로·조직문화·직무 인터뷰 상수다. Admin mock·이전 합본 시드는 SSOT가 아니다.

선행 문서 `recruit-guide-platform-seed-backend-cursor-prompt-2026-09-25.md` 의 **문구 JSON은 이 문서와 같다.**  
그 문서는 배너·커버 **파일 바이트를 넣지 말라고** 했다. 그 지시만 이 문서가 덮어쓴다. 키만 있으면 공개 URL이 404이고, Platform은 깨진 URL을 그대로 그린다.

Flyway `V22__careers.sql` 과 기존 `scripts/seed_careers_local.sql` 은 이미 `ja_cms_local` 에 있다.  
이번 작업은 **채용 안내(배너·조직문화·인터뷰) 문구 + 이미지 2개**만 맞춘다. 테이블·API를 새로 만들지 마라.

---

## Goal

로컬/dev Homepage DB의 채용 안내가 Platform `/about/careers` 히어로·조직문화·직무 인터뷰와 같게 한다. 배너·인터뷰 커버 URL은 **실파일 200**이다.

| 화면 | Admin | Public |
|------|-------|--------|
| 채용 안내 | `GET /api/admin/careers/guide` | `GET /api/public/careers/guide` |

완료 조건:

1. 무토큰 `GET /api/public/careers/guide` 가 아래 JSON과 **문자 단위 동일**하다. `mainText`·`subTextKo` 의 `\n` 은 실제 개행이다.
2. `cultureItems` 길이 **4**. 첫 `code` 는 `MAKE_AN_IMPACT`. `displayOrder` 는 1→4.
3. `interviews` 길이 **3**. 첫 `storyKey` 는 `story-metlife-2026`, `year` 는 `2026`.
4. 배너 URL·인터뷰 커버 URL을 curl 하면 **HTTP 200** + `image/png`. 바이트 크기는 아래 표와 같다.
5. 시드는 **idempotent**. 조직문화 4행·인터뷰 3행을 늘리거나 줄이지 않는다. 객체·asset 행도 두 번 실행해도 늘지 않는다(덮어쓰기 OK). TRUNCATE 금지.
6. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL·업로드를 자동 실행하지 않는다.
7. Admin/Platform 프론트 파일은 수정하지 않는다.

---

## Out of scope / 금지

- 채용공고 `job-1`…`job-10` 재시드·삭제. 인재 지원자 INSERT.
- 조직문화 행 추가·삭제. 인터뷰를 3건이 아닌 다른 `storyKey`·제목으로 바꾸기.
- 1×1 더미·빈 파일·단색 placeholder. 아래 SHA-256과 다른 바이트.
- `bannerImageUrl` / `coverImageUrl` 컬럼에 `http://localhost:9000/...` 를 저장. 공개 URL은 조회 시 storage key에서 만든다.
- 배너를 Unsplash URL로 두기.
- storage_key rename. 키는 `local/seed/careers-hero.png`, `local/seed/careers-story-metlife.png` 그대로.
- 히어로 라벨 `인재채용`, `imageAlt`, `How We Thrive`, thrive `tone` / `column` / decoration SVG 5종, 인터뷰 `categoryLabel` `스토리`, `titleLines` 를 DB 컬럼으로 추가. Platform 고정 카피·번들 장식이다.
- 페이지 배경 `careers-gradient.png`, 더보기 아이콘(`add.svg`·`close.svg`·chevron) 업로드.
- 조직문화 `title`·`description` 에 Platform `summaryLines` / `detailLines` 와 같은 `\n` 줄바꿈을 넣는다. 공개·Admin 화면이 동일하게 개행을 쓴다.
- 인터뷰 `year` 에 월·일(`2026년 08월 15일`)을 넣기. 연도 정수만. Platform 노출 일자는 프론트 전용이다.
- 안내 `PUT` API, DTO, OpenAPI 변경.
- 공고 29건, 지원자 `홍길동`.

---

## 시드 규칙 — 문구

스크립트: `scripts/seed_careers_guide_local.sql`  
없으면 이 이름으로 만든다. 기존 `scripts/seed_careers_local.sql` 의 **안내 UPDATE 구간만** 이 JSON으로 바꿔도 된다. 그 스크립트의 공고·지원자 구간은 실행하지 마라.

1. 안내 싱글톤 행이 없으면 실패로 보고하고 INSERT하지 마라. `V22` 가 만든다.
2. 조직문화는 `code` 로 UPDATE만. `MAKE_AN_IMPACT` · `KEEP_LEARNING` · `SPEAK_OPENLY` · `READY_TO_HELP` 중 없으면 실패로 보고한다.
3. 인터뷰는 `story_key` 로 UPDATE만. `story-metlife-2026` · `story-summer-camp` · `story-volunteer-day` 중 없으면 실패로 보고한다.
4. 배너 asset은 `storage_key = local/seed/careers-hero.png`, purpose `CAREERS_HERO`. 없으면 INSERT, 있으면 그 id를 배너에 연결한다. status `READY`.
5. 인터뷰 커버는 3행이 **같은** asset. `storage_key = local/seed/careers-story-metlife.png`, purpose `CAREERS_STORY`.
6. 안내·문화·인터뷰 시드 행 `version = 0`. 문화 행에 version 컬럼이 없으면 만들지 마라.
7. 스크립트를 두 번 실행해도 문화 4, 인터뷰 3, 공고 건수, 지원자 건수가 그대로다.

실행:

```bash
docker exec -i jaback-postgres-1 \
  psql -U ja_cms -d ja_cms_local < scripts/seed_careers_guide_local.sql
```

`mainText`·`subTextKo` 의 `\n` 은 SQL에서 실제 개행(`E'...\n...'`)으로 저장한다.

---

## 시드 규칙 — 실파일

기존 로컬 시드 MinIO 업로드 패턴을 재사용하라.  
예: `scripts/upload_local_seed_minio.py` 가 있으면 이 2키를 추가.  
없으면 `scripts/upload_careers_guide_seed_minio.py` (또는 `.sh`) 를 **local/dev 전용**으로 추가하라.

1. 프론트 레포에서 아래 2파일을 백엔드 `scripts/seed-assets/careers/` 로 복사한다. 커밋해도 된다.
2. MinIO `homepage-public`(로컬이 쓰는 동일 public 버킷)에 put. 키는 표의 `storage_key`.
3. DB asset 행은 같은 `storage_key` 가 있으면 UPDATE(status `READY`)·없으면 INSERT. purpose는 표와 같다. 같은 키로 행을 쌓지 마라.
4. 안내 배너·인터뷰 3행이 그 asset id를 가리키게 한다. 이미 같은 키를 가리키면 id는 유지한다.
5. Content-Type은 `image/png`.
6. 업로드를 두 번 해도 객체 1개·asset 행 1개(키당)다. 덮어쓰기 OK.
7. 버킷·엔드포인트·공개 URL 규칙은 **이미 200인 다른 local/seed 객체**와 같게 맞춰라.

| storage_key | purpose | 프론트 원본 (jakorea) | bytes | SHA-256 |
|-------------|---------|------------------------|------:|---------|
| `local/seed/careers-hero.png` | `CAREERS_HERO` | `apps/platform/src/features/careers/image/illustration/hero.png` | 1872155 | `735ab773790a2958b58ec9b0862dd4d424e0e3985ae9daac297c51dd82caa569` |
| `local/seed/careers-story-metlife.png` | `CAREERS_STORY` | `apps/platform/src/features/careers/image/illustration/story-metlife.png` | 2046821 | `df00c1bad1b1c0dd96c1d990fd7b95511d3360dc7630879a96d8a4600e874a1a` |

Admin 대체 경로(해시 동일):

- `apps/admin/src/assets/images/recruit/hero.png`
- `apps/admin/src/assets/images/recruit/story-metlife.png`

인터뷰 3건은 커버를 공유한다. `story-metlife.png` 를 3번 올리지 마라.

---

## SEED_DATA

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
      "title": "청소년의 성장이라는\n공동의 목적을 향해 함께 나아갑니다",
      "description": "각자의 노력이 만드는 작은 변화가 더 큰 사회적 가치로 이어진다고 믿으며, 맡은 일에 책임감을 가지고\n긍정적인 변화를 만들어갑니다."
    },
    {
      "displayOrder": 2,
      "code": "KEEP_LEARNING",
      "label": "Keep Learning",
      "title": "배움은 성장의 시작입니다",
      "description": "호기심을 가지고 새로운 것에 도전하며 끊임없이\n배우고 더 나은 방법을 함께 찾아갑니다."
    },
    {
      "displayOrder": 3,
      "code": "SPEAK_OPENLY",
      "label": "Speak Openly",
      "title": "좋은 아이디어는\n열린 소통에서 시작됩니다",
      "description": "신뢰와 정직을 바탕으로 자유롭게 의견을 나누며,\n직급이나 역할에 관계없이 서로의 목소리에\n귀 기울이고 더 나은 방향을 함께 만들어갑니다."
    },
    {
      "displayOrder": 4,
      "code": "READY_TO_HELP",
      "label": "Ready to Help",
      "title": "협력은 서로를 존중하는\n마음에서 시작됩니다",
      "description": "다양한 의견에 귀 기울이고, 도움이 필요한 순간에는\n기꺼이 손을 내밀며 함께 해결책을 찾아갑니다."
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

Platform에만 있고 DB에 넣지 않는 값:

| Platform 상수 | DB |
|---------------|-----|
| `CAREERS_HERO.label` `인재채용` | 없음 |
| `CAREERS_HERO.imageAlt` | 없음 |
| `THRIVE_TITLE` `How We Thrive` + decoration SVG | 없음 |
| `summaryLines` / `detailLines` | `title`·`description` 의 `\n` (동일 줄바꿈) |
| `categoryLabel` `스토리`, `publishedAtLabel` 월·일 | `year` 정수만 |
| 인터뷰 3건 이미지 | 같은 `careers-story-metlife.png` |

---

## 검증

```bash
curl -sS http://localhost:8081/api/public/careers/guide
```

기대:

- `mainText` 에 개행 2개. 첫 줄 `가능성을 믿는 사람들이`.
- `subTextKo` 에 개행 1개.
- `subTextEn` 은 한 줄. 개행 없음.
- `cultureItems` 4. 순서 `MAKE_AN_IMPACT`, `KEEP_LEARNING`, `SPEAK_OPENLY`, `READY_TO_HELP`.
- `cultureItems[0].title` 에 개행 1개 (`청소년의 성장이라는` / `공동의 목적을…`).
- `cultureItems[0].description` 에 개행 1개.
- `interviews` 3. 첫 `storyKey` `story-metlife-2026`, `year` 숫자 `2026`.
- 인터뷰 3건 `coverImageUrl` 이 같은 키 `local/seed/careers-story-metlife.png`.
- 공고 건수·지원자 건수는 이 스크립트 전과 같다.

```bash
python3 - <<'PY'
import hashlib, json, urllib.request
guide = json.load(urllib.request.urlopen("http://localhost:8081/api/public/careers/guide"))
expect = {
    "hero": ("local/seed/careers-hero.png", 1872155, "735ab773790a2958b58ec9b0862dd4d424e0e3985ae9daac297c51dd82caa569"),
    "story": ("local/seed/careers-story-metlife.png", 2046821, "df00c1bad1b1c0dd96c1d990fd7b95511d3360dc7630879a96d8a4600e874a1a"),
}
urls = {
    "hero": guide["bannerImageUrl"],
    "story": guide["interviews"][0]["coverImageUrl"],
}
assert guide["interviews"][0]["coverImageUrl"] == guide["interviews"][1]["coverImageUrl"] == guide["interviews"][2]["coverImageUrl"]
for name, url in urls.items():
    key, size, digest = expect[name]
    assert key in url, (name, url)
    data = urllib.request.urlopen(url).read()
    got = hashlib.sha256(data).hexdigest()
    assert len(data) == size and got == digest, (name, len(data), got)
    print(name, "200", len(data), got[:12])
print("images ok")
PY
```

문화·인터뷰 `title` 이 위 JSON과 한 글자라도 다르면 시드를 다시 UPDATE하고 curl로 재확인한다.  
해시가 다르면 원본 PNG를 다시 올리고, 더미로 대체하지 마라.

스크립트·업로드를 두 번 실행한 뒤 문화 4·인터뷰 3·asset 행(키당 1)·객체 수가 늘지 않는지 확인하라.

---

## 회신 템플릿

```text
## 한 일
- SQL:
- 업로드 스크립트:
- 실행한 DB / 버킷:

## 검증
- mainText 개행 수:
- culture codes:
- interview storyKey / year:
- hero HTTP / bytes / sha256 앞 12자:
- story HTTP / bytes / sha256 앞 12자:
- 인터뷰 3건 커버가 같은 URL인가:
- 공고 건수 변화:
- 지원자 건수 변화:
- 2회 실행 후 행·객체 증분:

## 하지 않은 일
- 프론트 수정 없음
- 공고·지원자 시드 없음
- thrive SVG·그라데이션·아이콘 업로드 없음
- API/DTO 변경 없음

## 막힌 점
- (없으면 없음)
```

**Last updated:** 2026-09-26
