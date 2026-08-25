# 회원 관리 (members) API 문서

CMS LNB 「회원 관리」(회원 목록 · 권한 승인 · 권한 설정) API 연동·백엔드 핸드오프 모음입니다.

파일명 `YYYY-MM-DD`는 해당 문서 **마지막 내용 갱신일**입니다.

| 문서 | 용도 |
|------|------|
| [**instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md**](./instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md) | **백엔드 수정 요청 SSOT** — **강사 상세** 프로젝트 참여 이력(수강·강의·봉사) · **정산 현황** API 보완 통합 (PH-001~016 · SET-001~008) (P0/P1) |
| [**member-consent-filled-document-backend-handoff-2026-08-25.md**](./member-consent-filled-document-backend-handoff-2026-08-25.md) | **백엔드 전달** — 회원 동의서 5종 작성 본문 저장·조회 (`WritingFormDraft` · 지급조서 sidecar · 성범죄 파일) · UI 기준 저장 항목 · **개인·교사·강사·강사겸교사** (P1) |
| [**school-organization-program-enrollment-history-backend-handoff-2026-08-25.md**](./school-organization-program-enrollment-history-backend-handoff-2026-08-25.md) | **백엔드 신규 API** — 학교(organization) 상세 프로젝트 수강 이력 전용 목록·bulk-delete · mock·member API 조합 금지 (P0) |
| [**member-program-history-ui-api-parity-backend-handoff-2026-08-25.md**](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md) | **백엔드 수정 요청** — 회원 상세 프로젝트 참여 이력 UI·API 정합성 · REQ-001~016 (부분일치/불일치 → BE 수정 SSOT). **강사 상세만** → [통합 핸드오프](./instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md) |
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

백엔드는 monorepo를 보지 않으므로 **내보낸 폴더·zip** 으로 전달합니다.

```bash
# handoff + README → apps/cms/dist/members-be-handoff-YYYY-MM-DD/
pnpm --filter cms package:members-be-handoff

# OpenAPI snapshot 포함
pnpm --filter cms package:members-be-handoff -- --openapi

# 출력 경로 지정 (슬랙·메일 첨부용)
pnpm --filter cms package:members-be-handoff -- --out=~/Desktop/jakorea-members-be-handoff
```

**Last updated:** 2026-08-25 (강사 상세 프로그램 이력·정산 통합 핸드오프)
