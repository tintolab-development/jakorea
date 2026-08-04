# 회원 관리 (members) API 문서

CMS LNB 「회원 관리」(회원 목록 · 권한 승인 · 권한 설정) API 연동·백엔드 핸드오프 모음입니다.

파일명 `YYYY-MM-DD`는 해당 문서 **마지막 내용 갱신일**입니다.

| 문서 | 용도 |
|------|------|
| [**members-api-backend-handoff-2026-07-31.md**](./members-api-backend-handoff-2026-07-31.md) | **백엔드 전달 (통합 · 2026-07-31)** — admin unmask P0 · admin-accounts · 등록·상세 · 마스킹 · **§4.1 등록 약관(4유형)** · 체크리스트 **1파일** |
| [instructor-pre-register-detail-roundtrip-handoff-2026-07-31.md](./instructor-pre-register-detail-roundtrip-handoff-2026-07-31.md) | **강사 사전등록 ↔ 상세** · **§3.8 CMS 화면 기준 구조체 제안** · 소속·마스킹 |
| [admin-permission-settings-ui-api-handoff-2026-07-30.md](./admin-permission-settings-ui-api-handoff-2026-07-30.md) | **관리자 권한 설정** UI(스크린샷) ↔ API 카탈로그·역할별 granted 정합 요청 |
| [members-api-backend-handoff-2026-07-23.md](./members-api-backend-handoff-2026-07-23.md) | (아카이브) 7/23 분할 handoff |
| [members-pre-register-handover-2026-07-28.md](./members-pre-register-handover-2026-07-28.md) | (아카이브) 7/28 pre-register |
| [e2e-members-instructor-revoke-list-status-handoff-2026-07-29.md](./e2e-members-instructor-revoke-list-status-handoff-2026-07-29.md) | (아카이브) 7/29 revoke · E2E |
| [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md) | FE 연동 명세 (모듈 키·endpoint·mapper·캐시) |
| [e2e-members-pre-register-handoff-2026-07-23.md](./e2e-members-pre-register-handoff-2026-07-23.md) | E2E 관측 — 등록 path·pre-register (M1/M2) |
| [members-api-backend-gaps-2026-07-23.md](./members-api-backend-gaps-2026-07-23.md) | 갭·스펙 불일치 목록 (2026-06 기준, 일부 outdated) |
| [members-api-detail-missing-endpoints-handoff-2026-06-26.md](./members-api-detail-missing-endpoints-handoff-2026-06-26.md) | 회원 상세 — OpenAPI 미존 endpoint |

**상위**

- [E2E 백엔드 수정 인덱스](../e2e-backend-fixes-index.md)
- [API 공통](../backend-handoff.md) · [라우트·클라이언트](../api-routes-and-client.md)
- OpenAPI subset: `apps/cms/openapi/members.openapi.json`

---

## 백엔드 전달 (레포 밖)

백엔드는 monorepo를 보지 않으므로 **내보낸 폴더·zip** 으로 전달합니다.

```bash
# 기본: handoff + E2E pre-register + README → apps/cms/dist/members-be-handoff-YYYY-MM-DD/
pnpm --filter cms package:members-be-handoff

# 연동·gaps·상세 미존 API + OpenAPI snapshot 포함
pnpm --filter cms package:members-be-handoff -- --full --openapi

# 출력 경로 지정 (슬랙·메일 첨부용)
pnpm --filter cms package:members-be-handoff -- --out=~/Desktop/jakorea-members-be-handoff
```

번들 안내(백엔드용 README 템플릿): [be-handoff-bundle/README-BE.md](./be-handoff-bundle/README-BE.md)

**Last updated:** 2026-07-31
