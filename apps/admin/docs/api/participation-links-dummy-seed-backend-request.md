# 참여하기 메뉴 링크 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `participation_link` |
| **FE SSOT** | [`apps/admin/src/features/participate/api/store.ts`](../../src/features/participate/api/store.ts) `buildSeed` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_participation_links_local.sql` |

## 실행 (로컬)

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_participation_links_local.sql
```

또는:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_participation_links_local.sql
```

## FE → API/DB 매핑

| FE | API | DB |
|----|-----|-----|
| `onlineLearningId` / `alumniId` | `id` (고정 1 / 2) | `id` |
| — | `menuCode` (`ONLINE_LEARNING` / `ALUMNI`) | `menu_code` |
| `onlineLearningUrl` / `alumniUrl` | `externalUrl` | `external_url` (빈 값 → `NULL`) |
| `onlineLearningVersion` / `alumniVersion` | `version` | `version` |

고정 2행 — 생성/삭제 없음. 시드는 **UPDATE** 멱등.

## 시드 2건

| id | menu_code | external_url |
|----|-----------|--------------|
| 1 | ONLINE_LEARNING | NULL (FE `''`) |
| 2 | ALUMNI | `https://gatheralumni.org/` |

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.participation_link` = 2
- [ ] id=1 `external_url` IS NULL · id=2 Alumni URL 일치
- [ ] Admin API 로그인 후 `/participate`에 FE mock과 동일 노출

**Last updated:** 2026-08-13
