# 메인 소셜 링크 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `main_social_link` |
| **FE SSOT** | [`apps/admin/src/features/social-link/api/store.ts`](../../src/features/social-link/api/store.ts) `SEED_ROWS` |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_main_social_links_local.sql` |

## 실행 (로컬)

```bash
# Postgres (docker 예: jakorea-postgres)
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_main_social_links_local.sql
```

또는:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_main_social_links_local.sql
```

## FE → API/DB 매핑

| FE | API (`SocialUpdateItem` / `SocialResponse`) | DB |
|----|-----------------------------------------------|-----|
| `channel` (`instagram` …) | `channelCode` (`INSTAGRAM` …) | `channel_code` (PK, 고정 6종) |
| `name` | `channelName` (고정) | `channel_name` |
| `isActive` | `enabled` | `enabled` |
| `linkUrl` | `externalUrl` | `external_url` (빈 값 → `NULL`, `https?://`만 허용) |
| `sortOrder` | `displayOrder` | `display_order` |
| `version` | `version` | `version` |

고정 채널: `INSTAGRAM`, `FACEBOOK`, `LINKEDIN`, `NAVER_BLOG`, `NEWSLETTER`, `YOUTUBE` — 생성/삭제 없음. 시드는 **UPDATE**(마이그레이션 seed 보정).

## 시드 6건

| # | channel | enabled | external_url |
|---|---------|---------|--------------|
| 1 | INSTAGRAM | true | https://www.instagram.com/jakorea_official/ |
| 2 | FACEBOOK | true | https://www.facebook.com/jakorea/?locale=ko_KR |
| 3 | LINKEDIN | true | https://kr.linkedin.com/ |
| 4 | NAVER_BLOG | true | https://section.blog.naver.com/BlogHome.naver?directoryNo=0&currentPage=1&groupId=0 |
| 5 | NEWSLETTER | true | https://stibee.com/ |
| 6 | YOUTUBE | true | https://youtube.com/user/jakorea2002 |

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.main_social_link` = 6
- [ ] `enabled=true` = 6
- [ ] Admin API 로그인 후 `/main/social-links`에 동일 노출

**Last updated:** 2026-08-13
