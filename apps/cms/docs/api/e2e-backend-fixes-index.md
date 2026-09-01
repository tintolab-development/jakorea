# E2E · 회원관리 API 백엔드 수정 요청 (인덱스)

CMS Playwright E2E · `/e2e-error-log` · 회원 관리 연동에서 **관측·확인된** 백엔드 4xx/5xx·계약 갭을 도메인별로 모아 전달합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-20 (등록·상세 path 분리: 2026-07-23) |
| **수집 출처** | Playwright E2E · `e2e-error-log` · 회원 관리 FE 연동 |
| **관련 FE 문서** | [playwright-flows.md](../e2e/playwright-flows.md) |

---

## 도메인별 문서

| 우선순위 | 도메인 | 대표 증상 | 문서 |
|----------|--------|-----------|------|
| **P0** | **members (목록 PII)** | `GET /api/admin/members/all` 연락처·이메일 **원문** | [**members-all-list-email-phone-masking-backend-request-2026-08-31.md**](./members/members-all-list-email-phone-masking-backend-request-2026-08-31.md) |
| **P0** | **members (동의 current·파일)** | 상세 수정 `PAYMENT_STATEMENT_CONSENT` **404** · 성범죄 업로드 **401** | [**member-consent-terms-current-404-crime-upload-401-backend-request-2026-08-31.md**](./members/member-consent-terms-current-404-crime-upload-401-backend-request-2026-08-31.md) |
| **P0** | **members (등록 동의서 본문)** | 동의서 작성 후 pre-register **HTTP 500** | [**member-pre-register-filled-document-500-backend-request-2026-08-26.md**](./members/member-pre-register-filled-document-500-backend-request-2026-08-26.md) |
| **P0** | **members (등록 약관)** | 선택 약관까지 필수 검증 · pre-register 400 | [**members-pre-register-terms-required-policy-backend-request-2026-08-11.md**](./members/members-pre-register-terms-required-policy-backend-request-2026-08-11.md) |
| **P0** | **members (관리자 회원)** | 일괄 삭제 불가 · 전체 목록 미노출 · 상세 약관·생년월일 누락 | [**admin-member-server-modification-request-2026-08-12.md**](./members/admin-member-server-modification-request-2026-08-12.md) |
| **P0** | **programs** | `POST /api/admin/programs` → `DATABASE_ERROR` (HTTP 500) | [e2e-programs-create-database-error-handoff.md](./e2e-programs-create-database-error-handoff.md) |
| **P0** | **API 공통 (CMS·Platform)** | validation Bean 메시지 UI 직접 노출 · unmask `reason` minLength 5 | [backend-handoff §에러 응답](./backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통) · [Platform](./../../platform/docs/api/api-error-response-handoff-2026-07-31.md) |
| **P2** | **adminAuth** | 동일 계정 병렬 MFA → `MFA_CHALLENGE_INVALID` (FE는 storageState 로 완화) | [e2e-admin-auth-mfa-concurrency-handoff.md](./e2e-admin-auth-mfa-concurrency-handoff.md) |

> **회원 관리 백엔드 전달:** [members/](./members/README.md) 아래 최신 handoff 문서를 전달합니다.

---

## FE 재현 명령

```bash
# 일반 프로그램 등록 (DATABASE_ERROR 재현)
pnpm --filter cms test:e2e:programs:registration

# 회원 목록 CRUD · 권한 유형 변경
pnpm --filter cms test:e2e:members
```

실패/에러 시:

1. 터미널 `========== E2E 백엔드 에러 로그 ==========`
2. `apps/cms/test-results/e2e-error-log-latest.json`
3. 브라우저 `http://localhost:3000/e2e-error-log` (공유 스토어)

---

## 범위 밖 (이 묶음에서 다루지 않음)

- 예전 갭 목록(일부 outdated 가능) → [programs-api-backend-gaps.md](./programs-api-backend-gaps.md)
- 회원 **권한 관리** LNB의 ProgramRole 매트릭스 설계

---

## `NETWORK_ERROR` / `timeout of 30000ms exceeded` (인프라)

스크린샷처럼 **여러 GET이 동시에** `timeout of 30000ms exceeded` 로 쌓이면, 앱 버그가 아니라 **백엔드·프록시(ngrok 등) 무응답**입니다.

| 증상 | 원인 후보 | 대응 |
|------|-----------|------|
| 대시보드·회원·알림 등 서로 다른 URL이 같은 초에 타임아웃 | BE down / DB hang / ngrok 끊김 | BE·터널 재기동 후 `/api/admin/users` 등 단일 GET으로 확인 |
| HTTP Status·Request ID 비어 있음 | 응답 자체를 못 받음 (axios `timeout: 30_000`) | 게이트웨이·보안그룹·터널 상태 점검 |

**FE 완화 (이미 적용):**

1. E2E 에러 로그 — `NETWORK_ERROR`/타임아웃은 **60초 쿨다운**으로 버스트를 1건으로 합침
2. 회원·프로그램 E2E — 대시보드(`/`)를 거치지 않고 **대상 URL 직행**

이 항목은 백엔드 **비즈니스 에러 코드 수정** 대상이 아니며, 인프라 복구가 우선입니다.

**Last updated:** 2026-08-26
