# 회원 관리 (members) API 문서

CMS LNB 「회원 관리」(회원 목록 · 권한 승인 · 권한 설정) API 연동·백엔드 핸드오프 모음입니다.

파일명 `YYYY-MM-DD`는 해당 문서 **마지막 내용 갱신일**입니다.

| 문서 | 용도 |
|------|------|
| [**members-pre-register-terms-required-policy-backend-request-2026-08-11.md**](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md) | **백엔드 전달** — CMS 회원·강사 등록 약관 `required` 정책 불일치 (P0) |
| [**admin-member-server-modification-request-2026-08-12.md**](./admin-member-server-modification-request-2026-08-12.md) | **백엔드 전달** — CMS 관리자 회원 일괄삭제·전체 목록·등록 약관·상세·포털 최초 로그인·기본정보 PATCH 선택 동의 (P0/P1) |
| [**portal-instructor-role-request-create-structured-handoff-2026-08-13.md**](../portal-instructor-role-request-create-structured-handoff-2026-08-13.md) | **백엔드 전달** — 포털 강사 권한 신청 CREATE SnapshotJson → profile/settlement/termsAgreements 구조체 (breaking) |

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

**Last updated:** 2026-08-13
