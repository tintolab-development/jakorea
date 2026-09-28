# 메인 히어로 배너 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **갱신** | 2026-09-20 — FE SSOT를 Platform 홈으로 변경 (6건 placeholder → 3건 + 교실 PNG) |
| **대상** | Homepage Admin `main_hero_banner` |
| **FE SSOT** | Platform [`HOME_HERO_SLIDES`](../../../platform/src/features/home/lib/mock.ts) |
| **요청서 요약** | [platform-home-public-main-seed-backend-request.md](./platform-home-public-main-seed-backend-request.md) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_main_heroes_local.sql` |

## 실행 (로컬)

```bash
# Postgres (docker 예: jakorea-postgres / 컨테이너명 확인 후)
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_main_heroes_local.sql
```

또는 컨테이너 안:

```bash
docker exec -i <postgres-container> \
  psql -U postgres -d jakorea < scripts/seed_main_heroes_local.sql
```

## FE → API/DB 매핑

| FE (Platform) | API (`HeroCreateRequest`) | DB |
|---------------|---------------------------|-----|
| (항상 노출) | `enabled` | `enabled` |
| `eyebrow` | `topText` | `top_text` |
| `titleLines.join('\n')` | `mainTitle` | `main_title` |
| `description` | `bottomText` | `bottom_text` |
| 링크 없음 | `linkUrl` | `link_url` NULL |
| `sort` = 배열 순서 | `displayOrder` | `display_order` |
| `imageUrl` (`hero-classroom.png`) | `imageAssetId` | `image_asset_id` — 3행 동일 에셋 |

Admin localStorage mock(`apps/admin/.../hero-banner/api/store.ts` 6건 SVG)은 **DB 시드 SSOT가 아니다**.

## 시드 3건

| # | enabled | top_text | main_title | link |
|---|---------|----------|------------|------|
| 1 | true | JA KOREA | 청소년의 가능성이\n더 넓은 세상과 만납니다 | N |
| 2 | true | JA KOREA | 경제교육으로 여는\n청소년의 내일 | N |
| 3 | true | JA KOREA | 배움의 기회를\n모든 청소년에게 | N |

`bottom_text`는 슬라이드마다 다름 — Platform mock `description` 그대로.

이미지: `homepage.homepage_asset`에 Platform `apps/platform/src/features/home/image/background/hero-classroom.png`를 `local/seed/main-hero-classroom.png` (`MAIN_HERO_IMAGE` / `READY`)로 1건 올리고 3행이 공유한다. 기존 SVG placeholder 재사용 중단.

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.main_hero_banner` = 3
- [ ] `enabled=true` = 3
- [ ] 3행 `image_asset_id` 동일, placeholder SVG 아님
- [ ] Admin API 로그인 후 `/main/hero-banners`에 동일 노출

**Last updated:** 2026-09-20
