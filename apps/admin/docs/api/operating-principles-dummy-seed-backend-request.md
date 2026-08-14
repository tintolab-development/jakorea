# 투명경영 운영원칙 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | `ja_transparency_principle_setting`, `ja_transparency_principle` |
| **FE SSOT** | [`apps/admin/src/features/operating-principles/api/store.ts`](../../src/features/operating-principles/api/store.ts) `SEED_INTRO` / `SEED_ROWS` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_transparency_principles_local.sql` |

## 실행 (로컬)

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_ja_transparency_principles_local.sql
```

## FE → API/DB 매핑

| FE | API | DB |
|----|-----|-----|
| `intro.topSubText` | `introSubText` | `intro_sub_text` |
| `intro.mainText` | `introMainText` | `intro_main_text` |
| `settingVersion` | `settingVersion` | setting.`version` |
| `p1`…`p5` | `id` 1–5 | `id` / `item_code` PRINCIPLE_n |
| `isActive` | `enabled` | `enabled` |
| `subText` | `subText` | `sub_text` |
| `sortOrder` | `displayOrder` | `display_order` |

고정 5칸 — INSERT/DELETE 없음, **UPDATE**만.

## 완료 기준

- [ ] setting intro 텍스트 = FE SEED_INTRO
- [ ] 5 principles `enabled=true`, title/sub = SEED_ROWS
- [ ] Admin API 로그인 후 `/ja-korea/principles` 동일 노출

**Last updated:** 2026-08-13
