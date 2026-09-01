# 관리자 인증(MFA) · 병렬 challenge — 백엔드 참고

회원/프로그램 E2E를 **동일 어드민 계정으로 workers>1** 실행할 때 관측되었던 MFA 오류입니다.  
**P0 장애는 아닙니다.** 동시 로그인·challenge 정책 확인용으로 전달합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-20 |
| **갱신** | 2026-07-20 — FE: `auth.setup` + `storageState` 로 E2E MFA 1회화 |
| **도메인** | `adminAuth` |
| **우선순위** | **P2** (동시성·정책 확인) |
| **관련 경로** | `POST /api/admin/auth/login` · `…/mfa/verify` · `…/mfa/enrollment` |
| **관련 계약** | [backend-handoff.md](./backend-handoff.md) §인증 |
| **인덱스** | [e2e-backend-fixes-index.md](./e2e-backend-fixes-index.md) |

---

## 관측 (과거 E2E)

| | |
|---|---|
| **에러 코드** | `MFA_CHALLENGE_INVALID` |
| **HTTP** | `401` |
| **메시지** | `MFA challenge is not pending.` |
| **발생 조건** | 동일 DEV 어드민으로 Playwright **워커 여러 개**가 각각 `login → MFA` |
| **호출 예** | `POST /api/admin/auth/mfa/verify` · (일부) `POST /api/admin/auth/mfa/enrollment` |

응답 예시:

```json
{
  "success": false,
  "data": null,
  "message": "MFA_CHALLENGE_INVALID: MFA challenge is not pending.",
  "error": {
    "code": "MFA_CHALLENGE_INVALID",
    "message": "MFA challenge is not pending.",
    "field": null,
    "traceId": "<서버 traceId>"
  }
}
```

---

## 추정 원인

1. 계정당 **단일 MFA challenge** — 새 login 이 이전 challenge 를 무효화  
2. 워커 A가 verify 하는 동안 워커 B의 login/enrollment 이 challenge 상태를 덮어씀  
3. enrollment 가 “pending challenge” 전제인데, 이미 verify 되었거나 만료됨

---

## FE 대응 (완료)

| 항목 | 내용 |
|------|------|
| Setup | `tests/e2e/auth.setup.ts` — 로그인·MFA **1회** 후 `tests/e2e/.auth/admin.json` 저장 |
| 프로젝트 | `chromium` → `dependencies: ['setup']` + `storageState` |
| 프로그램·회원 스펙 | 세션 재사용 (스펙마다 MFA 재로그인 안 함) |
| 스모크 | `storageState: {}` 로 비로그인 로그인 페이지만 검증 |

이에 따라 전체 `test:e2e` 병렬 실행 시에도 MFA challenge 충돌이 나지 않아야 합니다.  
(BE 동시 challenge 정책 자체는 여전히 제품/로드 테스트에서 유효한 확인 항목입니다.)

---

## BE에 확인 요청 (필수 수정은 아님)

| # | 질문 |
|---|------|
| 1 | 동일 계정 **동시 MFA challenge** 허용 여부 (세션/challengeUuid 단위) |
| 2 | 새 login 시 기존 pending challenge **무효화**가 의도된 동작인지 |
| 3 | `mfa/enrollment` 를 verify 직후·비-pending 상태에서 호출할 때 **401 대신 4xx+명확 코드**로 줄 수 있는지 |
| 4 | E2E/로드 테스트용 **계정 풀** 또는 challenge 격리 가이드 |

---

## 수락 기준 (선택)

동시 로그인을 지원할 경우:

- challengeUuid 단위로 verifyverify 가 간섭 없이 성공**하거나  
- 명확한 `MFA_CHALLENGE_SUPERSEDED` 등으로 **재로그인 유도**

**Last updated:** 2026-07-20
