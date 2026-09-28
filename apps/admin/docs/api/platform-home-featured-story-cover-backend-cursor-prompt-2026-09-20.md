# Cursor prompt — 홈 대표 스토리 커버 실파일 시드

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 값·파일 경로만** 사용하라.  
질문이 필요하면 스키마가 첨부·에셋을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/platform-home-featured-story-cover-backend-cursor-prompt-2026-09-20.md`

관련: `scripts/seed_impact_stories_local.sql`, `scripts/seed_main_content_local.sql`

---

## Goal

`GET /api/public/main` 의 `impact.featuredStory.imageUrl` 이 **브라우저에서 열리는 실 PNG** 여야 한다.

지금 로컬 응답:

```text
impact.featuredStory.id = 16
impact.featuredStory.title = 14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유
impact.featuredStory.imageUrl = http://localhost:9000/homepage-public/local/seed/impact-story-placeholder.png
```

이 URL은 **HTTP 404**. Platform 홈 대표 카드가 깨진 이미지(이미지 없음)로 나온다.

비교: 히어로는 같은 버킷에서 **200** 이다.

```text
http://localhost:9000/homepage-public/local/seed/main-hero-classroom.png  → 200 image/png
http://localhost:9000/homepage-public/local/seed/impact-story-placeholder.png → 404
```

완료 조건:

1. featured 스토리(`main_impact_content_setting.featured_story_id`, 로컬은 보통 id 16)에 `IMPACT_STORY_ATTACHMENT` 실파일이 있다.
2. 객체 키·파일명에 `placeholder` 가 없다.
3. `GET /api/public/main` → `impact.featuredStory.imageUrl` 을 curl 하면 **HTTP 200** + `image/*`.
4. 시드는 **idempotent**. 재실행해도 첨부가 쌓이지 않는다.
5. **local/dev 전용.** prod Flyway에 운영 바이너리를 넣지 마라.

---

## Out of scope / 금지

- OpenAPI / `PublicMainResponse` 필드 추가·삭제
- 임팩트 스토리 목록 3건 추가 (public main은 featured 1건만)
- `impact-story-placeholder.png` 를 빈 파일·더미 1x1로 남기기
- 객체만 DB에 가리키고 바이너리를 안 올리는 것
- Admin FE localStorage mock 수정 (프론트 작업 아님)

---

## 에셋 파일 (프론트 레포에서 복사)

프론트 레포 `jakorea` 기준 **이 파일만**:

```
apps/platform/src/features/impact-story/image/illustration/card-minjae.png
```

권장 저장 경로:

```
local/seed/impact-story-card-minjae.png
```

purpose: 기존 임팩트 스토리 첨부와 동일 (`IMPACT_STORY_ATTACHMENT`).  
히어로 `MAIN_HERO_IMAGE` 를 재사용하지 마라.

`homepage_asset` 에 올리고 `READY` 로 둔 뒤, featured 스토리의 `attachment_asset_id`(또는 동등 FK)에 연결하라.

publicUrl 규칙:

- 히어로가 지금 쓰는 것과 **같은 방식**으로 내려라 (로컬에서 히어로 PNG가 200이면 그 스킴을 재사용해도 된다).
- 파일명·키에 `placeholder` 금지. Platform은 `impact-story-placeholder` URL을 이미지 없음으로 버린다.
- 객체가 없으면 히어로와 달리 404가 난다. **반드시 바이너리를 복사**하라.

기존 `local/seed/impact-story-placeholder.png` 객체가 있으면 삭제하거나 더 이상 가리키지 마라. 그 키에 실파일을 덮어씌워도, URL에 `placeholder` 가 남으면 Platform이 쓰지 않는다.

---

## DB 연결

1. `main_impact_content_setting.featured_story_id` 가 NOT NULL 인지 확인. 없으면 공개(published) 스토리 1건을 고른다. 로컬 시드 제목이 `14년 만에 심사위원으로!` 이면 그 행(id 16)을 유지하라.
2. 그 스토리에 첨부 에셋 id를 연결한다. 본문·제목·카테고리는 바꾸지 마라.
3. `GET /api/public/main` 매퍼가 첨부 `publicUrl` 을 `featuredStory.imageUrl` 로 내보내는지 확인하라. 비어 있으면 공개 매퍼를 고쳐라 (필드 추가는 하지 말고 기존 `imageUrl` 에 채워라).

스크립트는 기존 `seed_impact_stories_local.sql` / `seed_main_content_local.sql` 을 수정하거나, 같은 패턴의 local seed를 추가하라.

---

## 검수

```bash
# 1) public main
curl -sS http://localhost:8081/api/public/main

# 기대
# impact.featuredStory.id 존재
# impact.featuredStory.imageUrl 에 placeholder 없음
# imageUrl 이 http(s) 절대 URL

# 2) 커버가 실제로 열리는지 (imageUrl 값을 그대로)
curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" "<featuredStory.imageUrl>"
# 기대: 200 image/png 또는 image/jpeg
```

Admin 로그인 후 `/main/contents` 「대표 콘텐츠 이미지」 미리보기에 깨진 아이콘이 없어야 한다.

---

## 작업 후 회신 형식

```text
- 변경 스크립트: (파일 목록)
- 에셋 경로: (homepage_asset local/seed/…)
- featured_story_id: (숫자)
- GET /api/public/main impact.featuredStory.imageUrl: (URL)
- 그 URL HTTP status: (숫자)
- 막힌 제약: (있으면 스키마 그대로)
```

**Last updated:** 2026-09-20
