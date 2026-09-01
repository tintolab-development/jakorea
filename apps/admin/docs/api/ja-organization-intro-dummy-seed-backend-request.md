# 기관소개 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 기관소개 (`ja_korea_introduction` 등) |
| **FE SSOT** | `ja-korea-intro` / `global-value` / `ja-korea-worldwide` / `ja-korea-bi` / `history-awards-certs` store SEED |
| **BE 스크립트** | `JAHOMEADMINBACK/scripts/seed_ja_organization_intro_local.sql` |

## 실행 (로컬)

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d jakorea \
  -f scripts/seed_ja_organization_intro_local.sql
```

또는 컨테이너 안:

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_ja_organization_intro_local.sql
```

## FE → DB 매핑 요약

| 화면 | FE | DB |
|------|----|----|
| 소개 | nested section/vision/mission | `ja_korea_introduction` flat columns |
| Global Value | `value_1`…`5`, `isActive` | `ja_global_value` id 1–5, `enabled` |
| Worldwide | `bottomText`, branch `linkUrl` | `guidance_text`, `ja_worldwide_link.external_url` |
| BI | `title`/`mainText`/`subText` | `ja_bi_setting` |
| 연혁/수상/인증 | `isPublic`, dates, texts | `ja_history` / `ja_award` / `ja_certification` |

## 시드 건수

| 대상 | 건수 |
|------|------|
| introduction | 1 (UPDATE) |
| global_value | 5 (enabled=true) |
| worldwide links | 7 (URL 채움) |
| bi | 1 (UPDATE) |
| history | 10 |
| award | 5 |
| certification | 4 |

## 완료 기준

- [ ] `ja_global_value` enabled = 5
- [ ] `ja_worldwide_link` URL not null = 7
- [ ] history 10 / award 5 / cert 4
- [ ] Admin API 로그인 후 기관소개 5화면 노출

**Last updated:** 2026-08-13
