# 오시는 길 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin `ja_directions_setting` (singleton `id=1`) |
| **FE SSOT** | [`apps/admin/src/features/directions/api/store.ts`](../../src/features/directions/api/store.ts) |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_directions_local.sql` |

## 실행 (로컬)

```bash
# Postgres (docker 예: jakorea-postgres)
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_ja_directions_local.sql
```

또는:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_ja_directions_local.sql
```

## FE → API/DB 매핑

| FE (`DirectionsInfo`) | API (`DirectionsResponse` / Update) | DB (`ja_directions_setting`) |
|-----------------------|--------------------------------------|------------------------------|
| `addressKo` | `koreanAddress` | `korean_address` |
| `addressEn` | `englishAddress` | `english_address` |
| `kakaoMapHtml` | `kakaoMapHtml` (렌더/파싱) | `kakao_map_timestamp` / `kakao_map_key` / `kakao_map_width` / `kakao_map_height` |
| `phone` | `phone` | `phone` |
| `fax` | `fax` | `fax` |
| `email` | `email` | `email` |
| `updatedAt` | `updatedAt` | `updated_at` |
| `version` | `version` | `version` |

> BE는 임의 HTML을 저장하지 않는다. Kakao Roughmap 생성 스니펫만 파싱해 필드 저장 후, 조회 시 동일 형식으로 재조립한다.

## 시드 1건 (UPDATE)

| 필드 | 값 |
|------|-----|
| korean_address | 서울특별시 강서구 마곡중앙로 171 (마곡나루역 프라이빗타워2차 714호) |
| english_address | Rm 714, Magoknaru Station Private Tower 2, … |
| kakao_map_* | timestamp=`1783579310022`, key=`2xyz`, 1440×728 |
| phone / fax / email | 02-783-2367 / 070-4275-5115 / jakorea@jakorea.org |

## 완료 기준

- [ ] `SELECT count(*) FROM homepage.ja_directions_setting WHERE id=1` = 1
- [ ] `korean_address` · `phone` · `kakao_map_key` not null
- [ ] Admin API 로그인 후 `/ja-korea/directions`에 동일 노출

**Last updated:** 2026-08-13
