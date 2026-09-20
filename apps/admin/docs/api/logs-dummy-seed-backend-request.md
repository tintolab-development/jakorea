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

## 시드 초기화 (2026-09-20) — 실제 이력이 남게

더미 SQL은 개발 채움용이다. **초기화 후에는 재실행하지 않는다.**  
실제 로그인·계정 처리·다운로드·PII·이슈는 BE가 append-only로 남긴다.

1. `seed-pii-*` / `seed-dl-*` / `seed-login-*` / `seed-admin-acct-*` / `seed-bug-*` **prefix 행만** DELETE.
2. 테이블 `TRUNCATE` 금지 — prefix 없는 행은 실제 이력이다.
3. 로컬 부팅·마이그레이션에서 위 두 SQL **자동 재실행 금지.**
4. 더미가 다시 필요하면 opt-in 스크립트만. prod Flyway에 더미 INSERT 금지.

상세 계약: [`logs-history-write-seed-backend-cursor-prompt-2026-09-20.md`](./logs-history-write-seed-backend-cursor-prompt-2026-09-20.md)

FE mock seed(~130)는 **Mock 로그인 전용**. 실이력은 API 로그인 + Homepage DB.

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

**Last updated:** 2026-09-20
