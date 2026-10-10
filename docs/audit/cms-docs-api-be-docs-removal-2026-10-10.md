# apps/cms/docs/api — BE 요청·핸드오프·cursor-prompt 제거 (2026-10-10)

## 재판정

`apps/cms/docs/api` 안 BE 티켓성 문서(이름에 `backend-request` / `backend-prompt` / `backend-cursor-prompt` / `*handoff*` / `cursor-prompt` 및 동등 BE 요청·confirm·contract)는 **프론트 레포 상시 SSOT가 아니라 전달·이력용**으로 판단해 제거했다.

- JSON 시드·페이로드는 **삭제 제외·유지**
- FE adapter / fe-acceptance / `*-api-integration.md` / Orval·라우트 가이드는 **유지**

## 결과

| 항목 | 수 |
|---|---:|
| 삭제 (md) | **227** |
| 잔여 md | 31 |
| 잔여 json | 64 |
| 폴더 내 파일 합계 (DS_Store 제외) | 95 |

상세 목록: [`cms-docs-api-be-docs-removal-2026-10-10.json`](./cms-docs-api-be-docs-removal-2026-10-10.json)

발췌가 필요하면 이전 이관본 [`extracted-ssot-2026-10-10/`](./extracted-ssot-2026-10-10/) 및 Git 이력을 본다.
