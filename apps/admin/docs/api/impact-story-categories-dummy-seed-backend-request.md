# 임팩트 스토리 카테고리 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 임팩트 스토리 · 카테고리 관리 |
| **FE SSOT** | `apps/admin/src/features/impact-stories/api/store.ts` `buildSeedCategories` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_impact_story_categories_local.sql` |
| **API** | `GET/POST /api/admin/impact-story/categories`, `PUT/DELETE …/categories/{id}` |

## 실행 (로컬)

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_impact_story_categories_local.sql
```

또는 컨테이너 안:

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_impact_story_categories_local.sql
```

## FE → DB 매핑

| FE mock | DB `impact_story_category.name` |
|---------|----------------------------------|
| 스토리 | 스토리 |
| 언론보도 | 언론보도 |
| 보고서 | 보고서 |
| 영상 | 영상 |
| 뉴스레터 | 뉴스레터 |

- `sortOrder`는 FE UI draft 전용 — DB/API에 없음 (목록은 `id` ASC).
- `version` / `storyCount`는 Admin API 응답 필드.

## 시드 건수

| 대상 | 건수 |
|------|------|
| category (필수 이름) | 5 (없으면 INSERT) |

> V9 마이그레이션이 동일 5건을 이미 넣습니다. 본 스크립트는 누락분만 보충합니다.

## FE 연동 상태

| 영역 | Remote |
|------|--------|
| 카테고리 list/save | ✅ (`shouldUseImpactStoryCategoriesRemoteApi`) |
| 스토리 CRUD | ❌ local mock (후속) |

## 완료 기준

- [ ] `impact_story_category`에 위 5 name 존재
- [ ] Admin API 로그인 후 카테고리 관리 모달에 5건 노출
- [ ] 카테고리 추가/이름 수정/미사용 삭제 후 「카테고리 저장」 반영

**Last updated:** 2026-08-13
