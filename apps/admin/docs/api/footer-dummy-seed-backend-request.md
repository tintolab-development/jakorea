# 푸터 관리 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `footer_top_menu` · `footer_organization` · `footer_partner` |
| **FE SSOT** | [`apps/admin/src/features/footer/api/store.ts`](../../src/features/footer/api/store.ts) `buildSeed*` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_footer_local.sql` |

## 실행 (로컬)

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_footer_local.sql
```

또는:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_footer_local.sql
```

## FE → API/DB 매핑

### 상단 메뉴 (고정 7)

| FE | API | DB |
|----|-----|-----|
| `id` | `menuCode` | `menu_code` |
| `name` | `label` (**읽기 전용** — PUT 불가) | `label` |
| `isInternal` | `linkType` | `link_type` |
| `linkUrl` | `externalUrl` | `external_url` |
| `isActive` | `enabled` | `enabled` |
| `sortOrder` | `displayOrder` | `display_order` |
| `version` | `version` | `version` |

### 기관 정보

| FE | API | DB |
|----|-----|-----|
| `name` | `organizationName` | `organization_name` |
| `address` / `zipCode` | `address` / `postalCode` | 동명 |
| `representative` | `representativeName` | `representative_name` |
| `businessNumber` | `businessRegistrationNumber` | `business_registration_number` |
| `phone` / `fax` / `email` | 동명 | 동명 |
| logo | `logo` / `logoAssetId` | `logo_asset_id` |
| `version` | `version` | `version` |

### 유관기관 로고 (고정 4)

| FE | API | DB |
|----|-----|-----|
| `footer-logo-{n}` / `partnerId` | `partnerId` | `id` |
| `name` | `organizationName` | `organization_name` |
| `isActive` | `enabled` | `enabled` |
| logo | `logo` / `logoAssetId` | `logo_asset_id` |

시드: id 1–3 enabled + logo asset; id 4 empty/disabled (FE mock).

## 완료 기준

- [ ] footer_top_menu = 7 · organization id=1 logo NOT NULL
- [ ] partners 1–3 `enabled=true` + logo · id=4 `enabled=false`
- [ ] Admin API 로그인 후 `/site/footer`에 FE mock과 동일 노출

**Last updated:** 2026-08-13
