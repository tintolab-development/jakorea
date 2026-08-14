# 사이트 정보 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `site_setting` |
| **FE SSOT** | [`apps/admin/src/features/site-info/api/store.ts`](../../src/features/site-info/api/store.ts) `buildSeed` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_site_settings_local.sql` |

## 실행 (로컬)

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_site_settings_local.sql
```

또는:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_site_settings_local.sql
```

## FE → API/DB 매핑

| FE | API | DB |
|----|-----|-----|
| `siteName` | `siteName` | `site_name` |
| `siteDescription` | `seoMetaDescription` | `seo_meta_description` |
| `ogImageUrl` / `ogImageFileName` | `ogImage.publicUrl` / `originalName` · 요청 `ogAssetId` | `og_asset_id` |
| `faviconUrl` / `faviconFileName` | `favicon.*` · 요청 `faviconAssetId` | `favicon_asset_id` |
| `version` | `version` | `version` |

싱글톤 id=1. 시드는 OG/favicon placeholder asset upsert + **UPDATE**.

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.site_setting` = 1
- [ ] `site_name` = `JA KOREA`, `og_asset_id` / `favicon_asset_id` NOT NULL
- [ ] Admin API 로그인 후 `/site/info`에 FE mock과 동일 텍스트 노출

**Last updated:** 2026-08-13
