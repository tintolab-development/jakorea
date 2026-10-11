---
priority: medium
always_include: false
category: data
---

# Mock data (CMS)

## 현재 상태

**`apps/cms/src/data/mock/` 디렉터리는 제거됨.** 런타임 소스는 `@/data/mock`을 import하지 않는다.

- 도메인 **타입·라벨·옵션**은 각 `features/**/model` 또는 `shared/constants`에 둔다.
- **목록/상세 row 시드**는 FE에 두지 않는다. QA·로컬 확인은 **백엔드/스테이징** 데이터를 사용한다.
- Entity `*-service.ts`는 **remote API** 또는 **빈 stub**(`createEmptyCrudService` 등)만 허용.

## 프로그램 관리 (일반 / UJAT / 1사1교 / Gemini / 교육받은 교사)

> 규칙: [program-no-fe-mock.mdc](../process/program-no-fe-mock.mdc)

| 구분 | 상태 |
|------|------|
| 목록·상세 FE 시드 | **없음** — remote API만 |
| API 미연동 탭 | 빈 UI + `program-api-unavailable` alert |
| 로컬 등록 `registration-local-save` | 사용자 작성분 — 시드와 별개로 허용 |

## 예외 (제한적)

| 허용 | 위치 |
|------|------|
| LNB 데이터관리 handoff용 **교과서 시드** | `features/textbook/api/textbook-lnb-seed-catalog.ts` |
| 권한 커스터마이즈 **in-memory 편집** | `features/permission/api/permission-customization-local.ts` |
| 단위 테스트 | `*.test.ts` 인라인 fixture |

## 검증

```bash
cd apps/cms && pnpm run check:no-mock-imports
```

## Related

- [program-no-fe-mock.mdc](../process/program-no-fe-mock.mdc)
- [program-type-isolation.mdc](../process/program-type-isolation.mdc)
- [fsd-structure.md](../architecture/fsd-structure.md)

**Last updated:** 2026-10-11
