# 메인 히어로 배너 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `main_hero_banner` |
| **FE SSOT** | [`apps/admin/src/features/hero-banner/api/store.ts`](../../src/features/hero-banner/api/store.ts) `SEED_ROWS` |
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

| FE | API (`HeroCreateRequest`) | DB |
|----|---------------------------|-----|
| `isActive` | `enabled` | `enabled` |
| `topText` / `mainTitle` / `bottomText` | 동일 | `top_text` / `main_title` / `bottom_text` |
| `linkUrl` | `linkUrl` | `link_url` (빈 문자열 → `NULL`, `https?://`만 허용) |
| `sortOrder` | `displayOrder` | `display_order` |
| `imageUrl` (mock data URL) | `imageAssetId` | `image_asset_id` → shared `MAIN_HERO_IMAGE` placeholder |

## 시드 6건

| # | enabled | top_text | main_title | link |
|---|---------|----------|------------|------|
| 1 | true | JA KOREA | 청소년의 가능성이 더 넓은 세상과 만납니다 | Y https://www.instagram.com/ |
| 2 | true | JA KOREA | 청소년의 가능성이 더 넓은 세상과 만납니다 | N |
| 3 | true | JA KOREA | 청소년의 가능성이 더 넓은 세상과 만납니다 | Y https://www.instagram.com/ |
| 4 | true | JA KOREA | 청소년의 가능성이 더 넓은 세상과 만납니다 | N |
| 5 | true | JA KOREA | 청소년의 가능성이 더 넓은 세상과 만납니다 | Y https://www.instagram.com/ |
| 6 | true | JA KOREA | 청소년의 가능성이 더 넓은 세상과 만납니다 | N |

공통 `bottom_text`: `JA Korea는 청소년들이 경제·금융·창업 교육을 통해 세상을 이해하고 미래를 준비할 수 있도록 돕습니다.`

이미지: `homepage.homepage_asset`에 `local/seed/main-hero-placeholder.png` (`MAIN_HERO_IMAGE` / `READY`) 1건을 재사용.

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.main_hero_banner` = 6
- [ ] `enabled=true` = 6
- [ ] Admin API 로그인 후 `/main/hero-banners`에 동일 노출

**Last updated:** 2026-08-13
