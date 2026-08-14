# 함께하는 사람들 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 함께하는 사람들 (`ja_people_org_chart`, `ja_board_member`) |
| **FE SSOT** | [`organization-chart/api/store.ts`](../../src/features/organization-chart/api/store.ts) · [`board-members/api/store.ts`](../../src/features/board-members/api/store.ts) `SEED_ROWS` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_people_local.sql` |

## 실행 (로컬)

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_ja_people_local.sql
```

또는:

```bash
docker exec -i <postgres-container> \
  psql -U postgres -d jakorea < scripts/seed_ja_people_local.sql
```

## FE → API/DB 매핑

### 조직도

| FE | API | DB |
|----|-----|-----|
| `mainTitle` | `title` | `title` |
| `imageUrl` / `imageAssetId` | `organizationChartImage` / `organizationChartAssetId` | `organization_chart_asset_id` (`JA_ORGANIZATION_CHART_IMAGE`) |
| `version` | `version` | `version` |

### 이사회

| FE | API | DB |
|----|-----|-----|
| `roleGroup` | `role` (`BOARD_CHAIR_PRESIDENT` …) | `role_code` |
| `isPublic` | `published` | `published` |
| `nameKo` / `nameEn` | `koreanName` / `englishName` | `korean_name` / `english_name` |
| `position` / `affiliation` | `positionTitle` / `affiliationTitle` | `position_title` / `affiliation_title` |
| `sortOrder` | `displayOrder` | `display_order` |
| `version` | `version` | `version` |

## 시드 건수

| 대상 | 건수 |
|------|------|
| org chart | 1 (title + placeholder PNG asset) |
| board members | **11** (Chair&President 2 · Fiduciary 3 · Board Chair 6, 전부 `published=true`) |

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.ja_board_member` = 11
- [ ] `ja_people_org_chart.id=1` title·asset NOT NULL
- [ ] Admin API 로그인 후 `/ja-korea/people` · `?tab=board`에 FE mock과 동일 노출

**Last updated:** 2026-08-13
