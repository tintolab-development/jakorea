# 개인후원 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | `personal_sponsorship_setting` · `personal_sponsorship_usage` |
| **FE SSOT** | [`individual-donation/api/store.ts`](../../src/features/individual-donation/api/store.ts) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_sponsorship_personal_local.sql` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_sponsorship_personal_local.sql
```

## 매핑

| FE | API | DB |
|----|-----|-----|
| `banner.mainText/subText` | `banner.mainText/subText` | `personal_sponsorship_setting.main_text/sub_text` |
| `banner.imageAssetId` | `bannerAssetId` | `banner_asset_id` (시드 NULL) |
| `usageGuideItems` | `usageItems` id 1–2 | `personal_sponsorship_usage` |
| `donateCta.linkUrl` | `donationButton.url` | `donation_url` |

## 완료 기준

- [ ] setting `donation_url` not null
- [ ] usage 2건 main/sub not null
- [ ] Admin API 로그인 후 `/sponsor/individual` 텍스트·URL 노출

**Last updated:** 2026-08-13
