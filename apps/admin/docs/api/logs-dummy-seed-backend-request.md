# 로그 관리 더미 시드 (FE mock → DB)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-13 |
| **대상** | Homepage Admin 로그 관리 전체 5화면 |
| **BE** | `JAHOMEADMINBACK` |

## 스크립트

| 스크립트 | 대상 |
|----------|------|
| `scripts/seed_logs_local.sql` | privacy-access · file-downloads |
| `scripts/seed_logs_admin_screens_local.sql` | member-logins · admin-account-actions · system-issues |

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_logs_local.sql

docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_logs_admin_screens_local.sql
```

(append-only · `trace_id` idempotent)

## 시드 건수

| 대상 | 건수 | trace_id prefix |
|------|------|-----------------|
| privacy | 80 | `seed-pii-*` |
| file-download | 60 | `seed-dl-*` |
| member-login | 80 | `seed-login-*` |
| admin-account | 80 | `seed-admin-acct-*` |
| system-issues | 80 | `seed-bug-*` |

## 로컬 적용 확인 (2026-08-13)

privacy/file + admin screens 시드 모두 적용됨.

**Last updated:** 2026-08-13
