# 임팩트 스토리 더미 시드 (Platform mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 임팩트 스토리 목록·상세 · Platform 공개 목록/상세/홈 서브카드 |
| **FE SSOT** | Platform `apps/platform/src/features/impact-story/lib/mock-stories.ts` `SEED` (18건) |
| **Admin mock** | `apps/admin/src/features/impact-stories/api/store.ts` `buildSeedStories` (동일 18건, JWT 없을 때) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_impact_stories_local.sql` |
| **카테고리 전용** | `seed_impact_story_categories_local.sql` (이름 5건) |
| **백엔드 프롬프트** | [impact-story-platform-seed-backend-cursor-prompt-2026-09-20.md](./impact-story-platform-seed-backend-cursor-prompt-2026-09-20.md) |

## 실행 (로컬)

명시 실행만. 앱 기동·Flyway가 자동으로 다시 넣지 않게 한다. **TRUNCATE 금지.**

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_impact_stories_local.sql
```

## 필터 → list GET (FE)

`list-filter-query-api.mdc` 파이프라인:

`applied` → `useImpactStoriesList(applied)` → `listStoriesService(filter)` → `list7(toStoryListParams(filter))`

| UI 필터 | Query |
|---------|-------|
| 공개여부 | `published` |
| 카테고리 | `categoryId` |
| 제목 | `title` |
| 작성자 | `authorName` |
| 게시일 | `publishFrom` / `publishTo` |
| 작성일 | `createdFrom` / `createdTo` |
| 페이지 | `page=0`, **`size=20`** |

Platform 공개 목록: `GET /api/public/impact-story/stories` (`categoryId`, `q` 제목 contains, `page`, `size=9`).

## 시드 건수

| 대상 | 건수 |
|------|------|
| category (필수 이름) | 5 |
| impact_story | **18** (pinned 3 · 전부 공개) |

> 메인 콘텐츠 `featured_story_id` = 「14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유」.  
> 커버는 Platform `apps/platform/src/features/impact-story/image/illustration/card-minjae.png`.  
> `impact-story-placeholder.png` · `localhost:9000` publicUrl 금지.  
> 카드 이미지는 mock과 동일하게 illustration PNG 10장을 `homepage_asset`에 복사한다.

## FE 연동

| 영역 | Remote |
|------|--------|
| Admin 카테고리 | ✅ |
| Admin 스토리 list/CRUD/toggle/bulk-delete | ✅ |
| Platform 공개 categories / stories / detail | ✅ (`apps/platform` `useImpactStoriesList` 등) |
| 인라인 에디터 이미지 | ❌ (BE sanitize) — 첨부로 |

**Last updated:** 2026-09-20
