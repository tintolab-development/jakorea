# 재능기부 더미 시드 (Platform 카피 → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-25 |
| **대상** | talent sponsorship 소개 · talent-applications |
| **FE SSOT** | [`apps/platform/src/features/talent-donation/lib/constants.ts`](../../../platform/src/features/talent-donation/lib/constants.ts) |
| **백엔드 프롬프트** | [`sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_sponsorship_talent_local.sql` |
| **seedLabel** | `platform-talent-donation-v1` |

## 실행

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_sponsorship_talent_local.sql
```

## 매핑

| Platform (`constants.ts`) | API / DB |
|---------------------------|----------|
| `HERO_TITLE_LINES` | `banner.mainText` (`\n` 결합) |
| `HERO_DESCRIPTION_LINES` | `banner.subText` (`\n` 결합) |
| `METHOD_CARDS` id mentoring/advisory/program_support | `howItems` id 1/2/3 |
| `TALENT_STORIES` im_minjae / lee_daehan | `interviews` interview_01 / interview_02 |
| CTA·section title | **DB 없음** (Platform 고정) |

## 완료 기준

- [ ] `GET /api/public/sponsorship/talent` 배너 문구에 개행 유지
- [ ] how 3 · interview 2 · `linkedStoryId` null · `imageAssetId` null
- [ ] 신청 시드 3건 (pending 2 · confirmed 1)
- [ ] Platform `/support/talent` 시드 문구 노출
- [ ] Admin `/sponsor/talent` JWT 시 동일 소개·신청 목록

**Last updated:** 2026-09-25
