---
priority: high
category: process
---

# CMS — 약관 및 동의 (회원 상세·등록)

**정책 원본(필수·선택·유효기간·미동의 제한):** [`.cursor/rules/terms-and-consent-policy.mdc`](../../../../.cursor/rules/terms-and-consent-policy.mdc)

Spec for consent UI in **member detail**, **registration modals**, and related flows. Keep in sync with `user-consent-agreement-section.tsx` and `resolveUserConsentAgreementPreset`.

## Common

- **Signup/register required consents:** Terms of service + PII collection. **Admin also requires MFA setup consent.** Block submit if required items are disagreed.
- **All other items are optional** for signup/register completion; declining still applies feature blocks below.
- Every item must have **동의 or 미동의** selected.
- Required disagree → alert title `필수 동의 항목 안내` listing item labels.
- Each item tracks **consent status**, **timestamp**, and **document** when required.
- **Document items**: radio (동의/미동의) + 「동의서 작성」; show **동의** only after agreement submission completes.

## CMS field ↔ policy (summary)

| Policy item | Typical CMS label | Document | Required at signup? | Roles / screens |
|-------------|-------------------|----------|---------------------|-----------------|
| 서비스 이용약관 | 서비스 이용약관 | — | **Yes** | Individual register; Admin register |
| 개인정보 수집·이용 | 개인정보 수집·이용 동의 | — | **Yes** | Individual, Instructor, Admin register; detail |
| MFA 설정 동의 | 2단계 인증(MFA) 설정 동의 | — | **Yes (admin)** | Admin register only |
| 마케팅 | 마케팅 제공 동의 | — | No | Register; detail |
| 초상권 | 초상권 수집·이용 동의 | ✓ `agreement-portrait` | No | Individual register; detail |
| 지급조서 | 지급조서 사전 동의서 / 지급조서 작성 동의 | ✓ `agreement-third-party` | No | Instructor; detail; settlement first-time |
| 교육진행자 서약 | 교육진행자 서약서 / 동의 서약 | ✓ `agreement-expense` | No | Instructor, UJAT volunteer |
| 행정정보 공동이용 | 행정정보 공동이용 사전동의서 | ✓ `agreement-notice` | No | Instructor, UJAT volunteer |
| 성범죄 경력조회 | 성범죄 경력 조회 동의서 | ✓ `agreement-crime` | No | Instructor, UJAT volunteer |

## Visibility by preset (detail)

| Item | Individual | Instructor (dual / only) | Admin |
|------|------------|--------------------------|-------|
| PII, Marketing, Terms | ✓ | ✓ | per preset |
| Portrait | ✓ | per preset | — |
| Payment statement | — | ✓ | — |
| Educator / Admin joint / Crime | — | ✓ | — |

**ADMIN** preset may hide items — if code diverges, update both this doc and the component.

## API / state (align with backend)

- Per-item: `agreedAt`, document id/version, expiry (1y / 10y / until withdraw).
- **동의서 보기**: `consent-records.formResponseId` → `MemberConsentDocumentViewModal` — **제출본만** 표시(회원 기본정보 prefill 금지). API 미연동 시 empty state.
- Payment statement: **first settlement** flag, **PII-expiry re-consent** flag.
- CMS: mostly read + status; e-sign payload in separate API spec when available.

## 동의서 작성 모달 (fill) — 상호작용

회원 등록·상세·강사 신규 등 **템플릿 관리 밖** 동의서 작성 UI는 아래 규칙을 따른다.  
→ **[agreement-consent-fill-interaction.mdc](../template/agreement-consent-fill-interaction.mdc)**

- **기본 정보 단락과 동의서 필드 분리** — 작성 진입 시 응답 전부 빈 상태, 등록 폼과 양방향 연동 없음
- **양식 본문**(동의 문구·표 셀) 수정 불가 / **응답**(지급조서 기본정보, 동의 라디오, 초상권 성명·소속) 입력 가능
- `preview` 모드 + 슬롯 CSS로 잠그지 말 것 — 지급조서·라디오까지 막힘
- 애매하면 코드 변경 전 사용자에게 확인

**Last updated:** 2026-08-11
