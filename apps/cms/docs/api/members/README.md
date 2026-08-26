# 회원 관리 (members) API 문서

CMS LNB 「회원 관리」(회원 목록 · 권한 승인 · 권한 설정) API 연동·백엔드 핸드오프 모음입니다.

파일명 `YYYY-MM-DD`는 해당 문서 **마지막 내용 갱신일**입니다.

---

## 회원 상세 이력·정산 — 백엔드 전달 필수 묶음

> **ZIP·산출내역·일괄삭제는 별도 전달이 아닙니다.** 아래 **7개 문서를 한 zip**으로 BE에 전달합니다.  
> `pnpm --filter cms package:members-be-handoff -- --openapi` 가 동일 구성을 복사합니다.

| # | 문서 | 대상 · 범위 | SSOT ID |
|---|------|-------------|---------|
| 1 | [**member-program-history-ui-api-parity-backend-handoff-2026-08-25.md**](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md) | **개인·순수 교사·강사·겸직** — 프로젝트 참여 이력 (수강·봉사·공통 모달) | REQ-001~016 |
| 2 | [**instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md**](./instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md) | **강사·겸직** — 참여 이력(강의 탭) · **정산 현황** | PH-001~016 · SET-001~009 |
| 3 | [**school-organization-program-enrollment-history-backend-handoff-2026-08-25.md**](./school-organization-program-enrollment-history-backend-handoff-2026-08-25.md) | **학교** — 프로젝트 수강 이력 (목록·bulk-delete) | §3 신규 API |
| 4 | [**admin-member-managed-program-history-backend-handoff-2026-08-25.md**](./admin-member-managed-program-history-backend-handoff-2026-08-25.md) | **관리자** — 프로그램 담당 이력 | ADM-001~007 |
| 5 | [**cms-table-bulk-download-api-backend-handoff.md**](../cms-table-bulk-download-api-backend-handoff.md) | **포함** — 과제 ZIP(#7) · 강의보고서 ZIP(#8) · 수료증/인증서 ZIP(#9) · 지급조서 ZIP(#6) | §5.1 #6~#9 |
| 6 | [**settlement-payment-order-detail-ui-fields-backend-handoff.md**](../settlement-payment-order-detail-ui-fields-backend-handoff.md) | **포함** — 강사 상세 **산출 내역서** 모달 (SET-005) · **지급조서 원문·unmask (SET-009)** | §4 · **§1.2** |
| 7 | [**cms-table-bulk-delete-api-backend-handoff.md**](../cms-table-bulk-delete-api-backend-handoff.md) | **포함** — 회원 이력·관리자 담당 이력 **일괄 삭제** | §5.1 #14 · #15 |

**ID 대응 (중복 추적 방지):** REQ-001~016 = PH-001~016 (강사 scope는 #2가 SSOT).

**OpenAPI:** `apps/cms/openapi/members.openapi.json` + (정산) `openapi/backend.openapi.json`

---

## 기타 members handoff

| 문서 | 용도 |
|------|------|
| [**member-consent-filled-document-backend-handoff-2026-08-25.md**](./member-consent-filled-document-backend-handoff-2026-08-25.md) | **백엔드 전달** — 회원 동의서 5종 작성 본문 저장·조회 (`WritingFormDraft` · 지급조서 sidecar · 성범죄 파일) · UI 기준 저장 항목 · **개인·교사·강사·강사겸교사** (P1) |
| [**portal-identity-onboarding-backend-request-2026-08-18.md**](./portal-identity-onboarding-backend-request-2026-08-18.md) | **백엔드 전달** — Portal 본인인증·온보딩 403/500 · CMS↔Portal 소속 동기화 · 비밀번호/409 메시지 (P0/P1) |
| [**admin-register-signup-type-portal-profile-backend-request-2026-08-14.md**](./admin-register-signup-type-portal-profile-backend-request-2026-08-14.md) | **백엔드 전달** — 가입유형 플래그 · 개인 학년(grade) · Portal 주소/소속 GET·PATCH (P0/P1) |
| [**members-pre-register-terms-required-policy-backend-request-2026-08-11.md**](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md) | **백엔드 전달** — CMS 회원·강사 등록 약관 `required` 정책 불일치 (P0) |
| [**admin-member-server-modification-request-2026-08-12.md**](./admin-member-server-modification-request-2026-08-12.md) | **백엔드 전달** — CMS 관리자 회원 일괄삭제·전체 목록·등록 약관·상세·포털 최초 로그인·기본정보 PATCH 선택 동의 (P0/P1) |
| [**portal-instructor-role-request-create-structured-handoff-2026-08-13.md**](../portal-instructor-role-request-create-structured-handoff-2026-08-13.md) | **백엔드 전달** — 강사 권한 신청 구조체 CREATE · 승인 상세 API · 강사 상세 양식 표시 · 대학/대학원 소속·학력 마스킹 (P0) |

**상위**

- [E2E 백엔드 수정 인덱스](../e2e-backend-fixes-index.md)
- [API 공통](../backend-handoff.md) · [라우트·클라이언트](../api-routes-and-client.md)
- OpenAPI subset: `apps/cms/openapi/members.openapi.json`

---

## 백엔드 전달 (레포 밖)

백엔드는 monorepo를 보지 않으므로 **[회원 상세 이력·정산 필수 묶음](#회원-상세-이력정산--백엔드-전달-필수-묶음)** 7개 문서 + README + (선택) OpenAPI 를 zip으로 전달합니다.

```bash
# 필수 묶음 7종 + README → apps/cms/dist/members-be-handoff-YYYY-MM-DD/
pnpm --filter cms package:members-be-handoff

# OpenAPI snapshot 포함
pnpm --filter cms package:members-be-handoff -- --openapi

# 출력 경로 지정 (슬랙·메일 첨부용)
pnpm --filter cms package:members-be-handoff -- --out=~/Desktop/jakorea-members-be-handoff
```

**Last updated:** 2026-08-26 (SET-009 지급조서 원문·산출 내역서 unmask)
