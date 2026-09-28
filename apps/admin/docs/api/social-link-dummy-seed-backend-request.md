# 메인 소셜 링크 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **갱신** | 2026-09-20 — Platform 홈 연동 시에도 **실채널 URL 유지** (generic fallback보다 우선) |
| **대상** | Homepage Admin `main_social_link` |
| **FE SSOT (시드 URL)** | [`apps/admin/src/features/social-link/api/store.ts`](../../src/features/social-link/api/store.ts) `SEED_ROWS` |
| **Platform fallback** | [`HOME_MAIN_FALLBACK.socialLinks`](../../../platform/src/features/home/lib/fallback.ts) — 호스트만 있는 임시 URL. 5번째 슬롯은 `mailto:` (PK는 `NEWSLETTER`) |
| **요청서 요약** | [platform-home-public-main-seed-backend-request.md](./platform-home-public-main-seed-backend-request.md) |
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

Platform 홈은 `channelCode`로 아이콘을 붙인다. 시드 URL이 있으면 remote가 fallback href를 덮어쓴다. `NEWSLETTER`는 Admin 뉴스레터(stibee) vs Platform 메일 아이콘 불일치가 남아 있다 — 채널 의미는 Admin PK를 따른다.

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.main_social_link` = 6
- [ ] `enabled=true` = 6
- [ ] Admin API 로그인 후 `/main/social-links`에 동일 노출

**Last updated:** 2026-09-20
