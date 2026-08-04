# CMS 회원 관리 API — 백엔드 전달 패키지

JaKorea **CMS** (`회원 관리` LNB) 프론트 연동 기준 백엔드 요청 문서입니다.

| 항목 | 값 |
|------|-----|
| **패키지 생성** | `pnpm --filter cms package:members-be-handoff` |
| **본문 (필수)** | `members-api-backend-handoff-2026-07-31.md` |
| **권한 설정 UI/API** | `admin-permission-settings-ui-api-handoff-2026-07-30.md` |
| **OpenAPI (선택)** | `--openapi` → `openapi/members.openapi.json` |

---

## 읽는 순서

1. **`members-api-backend-handoff-2026-07-31.md`** — P0 unmask · admin-accounts · 등록·상세 · 마스킹 · **§4.1 등록 약관** · 체크리스트 통합
2. **`admin-permission-settings-ui-api-handoff-2026-07-30.md`** — 관리자 권한 설정 화면(스크린샷) ↔ permission catalog / role granted 정합

---

## 2026-07-30 핵심 (P0)

- 관리자 상세·CRUD는 **`admin-accounts`** 인데 **개인정보 unmask** 만 legacy `/api/users/{uuid}/…` 로 호출되어 실패.
- BE는 **Option A** `POST /api/admin/admin-accounts/{adminId}/privacy/unmask` **(권장)** 또는 **Option B** admin 응답에 **`memberId` 하달** 중 **택 1** — 본문 §2.

## 2026-07-30 권한 설정

- UI 5열 카탈로그·역할별 체크와 API `domain`/`code`/`grantedPermissions` 불일치.
- 카탈로그 SSOT·roleCode·역할별 seed 확정 요청 — `admin-permission-settings-ui-api-handoff-2026-07-30.md`.

---

## FE E2E (CMS 측)

```bash
pnpm --filter cms test:e2e:members
```

**Last updated:** 2026-07-30
