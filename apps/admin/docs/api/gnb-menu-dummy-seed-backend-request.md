# GNB 메뉴 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `gnb_menu` |
| **FE SSOT** | [`apps/admin/src/features/gnb-menu/api/store.ts`](../../src/features/gnb-menu/api/store.ts) `SEED_GROUPS` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_gnb_menu_local.sql` |

## 실행 (로컬)

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_gnb_menu_local.sql
```

또는:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_gnb_menu_local.sql
```

## FE → API/DB 매핑

| FE | API | DB |
|----|-----|-----|
| item `id` (예 `ja-intro`) | `menuCode` (예 `JA_ORGANIZATION`) | `menu_code` PK |
| group `id` | `groupCode` | `group_code` |
| `name` | `displayName` | `display_name` |
| `isActive` | `enabled` | `enabled` |
| `sortOrder` | `displayOrder` | `display_order` |
| `version` | `version` | `version` |

고정 20행 — 생성/삭제 없음. 시드는 **UPDATE** 멱등.

## FE mock 특이점

| FE id | menu_code | enabled |
|-------|-----------|---------|
| `part-result` | `PARTICIPATION_RESULT` | **false** (마이그레이션 기본 TRUE → FE SSOT로 보정) |

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.gnb_menu` = 20
- [ ] `PARTICIPATION_RESULT.enabled` = false
- [ ] Admin API 로그인 후 `/site/gnb`에 FE mock과 동일 노출

**Last updated:** 2026-08-13
