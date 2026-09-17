---
priority: medium
always_include: false
category: data
---

# Mock data

## Placement

Keep mock **services** in `entities/*/api/*-service.ts` (or feature-local mocks when experimental). Arrays/objects should mirror real API shapes.

## Consistency

When deleting or mutating entities, keep **referential integrity** (e.g. cascade deletes where the real API would).

## 프로그램 관리 (일반 / UJAT / 1사1교 / Gemini / 교육받은 교사)

> **FE 시드·Mock 목록 데이터는 제거됨.** 복원하지 말 것.  
> 규칙: [program-no-fe-mock.mdc](../process/program-no-fe-mock.mdc)

| 구분 | 상태 |
|------|------|
| 목록·상세 시드 (`general-programs`, `economy-programs`, `ujat-*-mock` row 시드 등) | **제거/빈 stub** — remote API만 |
| API 미연동 탭 | 빈 UI + `program-api-unavailable` alert |
| `data/mock`에 남은 것 | **타입·라벨·옵션** 또는 타 도메인(대시보드·회원 이력)용 mock — 프로그램 관리 시드로 쓰지 말 것 |
| 로컬 등록 `registration-local-save` | 사용자 작성분 — 시드와 별개로 허용 |

레거시 시드 id(`general-prog-*` 등) 상수·문서 참조는 deprecated. 신규 QA는 **백엔드/스테이징 데이터**를 사용한다.

## Related

- [program-no-fe-mock.mdc](../process/program-no-fe-mock.mdc)
- [program-type-isolation.mdc](../process/program-type-isolation.mdc)
- [api-spec-mock.md](./api-spec-mock.md)
- [fsd-structure.md](../architecture/fsd-structure.md)

**Last updated:** 2026-09-16
