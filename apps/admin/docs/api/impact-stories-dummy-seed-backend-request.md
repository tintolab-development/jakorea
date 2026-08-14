# 임팩트 스토리 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 임팩트 스토리 목록·상세·카테고리 |
| **FE SSOT** | `apps/admin/src/features/impact-stories/api/store.ts` `buildSeedCategories` / `buildSeedStories` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_impact_stories_local.sql` |
| **카테고리 전용** | `seed_impact_story_categories_local.sql` (이름 5건만) |

## 실행 (로컬)

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

## 시드 건수

| 대상 | 건수 |
|------|------|
| category (필수 이름) | 5 |
| impact_story | 12 (고정 3 · 비공개 1 · 첨부 1) |

> 메인 콘텐츠 `featured_story_id`는 시드 첫 공개 스토리로 재연결합니다.

## FE 연동

| 영역 | Remote |
|------|--------|
| 카테고리 | ✅ |
| 스토리 list/CRUD/toggle/bulk-delete | ✅ |
| 인라인 에디터 이미지 | ❌ (BE sanitize) — 첨부로 |

**Last updated:** 2026-08-13
