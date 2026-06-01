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

## General programs (`general-programs.ts`)

세 그룹으로 구성한다.

### 1) Realistic (6건)

진행현황별 2건. 실제 후원사·프로그램명 스타일. id: `general-prog-scheduled-*`, `general-prog-in-progress-*`, `general-prog-completed-*`.

### 2) Type variant (8건)

등록 폼 선택에 따른 **8종 유형** mock. 규칙: [general-program-type-variant-spec.md](../process/general-program-type-variant-spec.md).

- id: `general-prog-type-{org|ind}-{curriculum|schedule}-{single|multi}`
- **title**: `일반 프로그램 (기관)_커리큘럼형_단일 회차` 형식 (8종 전체) — **목록·상세 헤더·breadcrumb**
- **공고용 프로그램명** 등 공통 정보 필드는 `generalCommonInfo` / `buildGeneralOrgCurriculumSingleProgramSeedFields()` (기관_커리큘럼형_단일 회차 스크린샷 mock: `general-prog-type-org-curriculum-single`)
- **LNB**: 강사·봉사(면접 2depth)·설문(3항목) **전부 포함**
- `generalProgramAudience` / `generalProgramEducationStructure` / `generalProgramSessionRound` 필드 설정
- 복수 회차: `rounds` 2건

### 3) LNB matrix (9건)

LNB 메뉴 조합 확인용. id: `general-prog-lnb-*`, title: `【LNB】…` 접두.

### 공통

- `category`: 목록 필터용 — 기관 유형 `school`, 개인 유형 `individual` 등
- `scheduleTimeEnabled: false` → `startTime`/`endTime` 없음 → 주간 격자 **종일** + 라벨 `종일` ([calendar-week-time-grid.md](../design/calendar-week-time-grid.md))
- 로컬 등록 저장본: `readGeneralRegistrationLocalSavePrograms()` — seed와 id 중복 시 seed 우선

## Related

- [general-program-type-variant-spec.md](../process/general-program-type-variant-spec.md)
- [api-spec-mock.md](./api-spec-mock.md)
- [fsd-structure.md](../architecture/fsd-structure.md)

**Last updated:** 2026-05-29
