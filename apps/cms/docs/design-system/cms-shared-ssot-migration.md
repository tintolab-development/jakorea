# CMS Shared SSOT 공통 마이그레이션

CMS Design System을 **공통화 엔진**이 아니라 **라이브 카탈로그**로 두고, 제품 룩의 SSOT는 `theme-provider` + `shared/*`에 고정한다. Platform·`packages/ui`는 이번 범위에서 제외한다.

## 경계

| 포함 | 제외 |
|------|------|
| `apps/cms/src/shared/ui`, `shared/components` | `apps/platform/**` |
| `apps/cms/src/app/providers/theme-provider.css` / `.tsx` | `packages/ui` |
| `/design-system` (쇼케이스) | `@jakorea/domain` · `location` · `rich-text` 등 공용 패키지 |
| CMS features/pages의 Current 채택 | DS `page.css`로 제품 룩 정의 |

**증거:** Platform은 `apps/cms`를 import하지 않는다. CMS `shared` / `theme-provider` 변경은 Platform에 영향 없다.

## SSOT 계약

```text
theme-provider (토큰) + shared/* (컴포넌트·colocated CSS)
        │
        ├─▶ /design-system   검증용 쇼케이스 (page.css = 데모 레이아웃만)
        └─▶ features/pages   조합·호출만 (동일 역할 로컬 재구현 금지)
```

1. 제품 룩을 바꾸려면 **토큰 또는 shared만** 수정한다.
2. DS `page.css`에는 데모 배치·폭 보정만 허용한다. 전역 디자인 토큰을 여기서 창설하지 않는다.
3. 화면은 Current `Cms*` / `shared/components`를 소비한다.
4. Not catalogued 영역을 메우기 위해 가짜 공통 컴포넌트를 만들지 않는다.

## 예외 허용 목록

| 영역 | 허용 | 비고 |
|------|------|------|
| Auth | `LoadingButton` (antd 기본 룩이 필요할 때) | 가능하면 `CmsButton`/`LoadingButton`로 raw `Button` 제거 |
| Dashboard 위젯 본체 | Not catalogued | 액션 버튼만 `CmsButton` 채택; 위젯 셸을 shared로 승격하지 않음 |
| 도메인 풀페이지 셸 | Not catalogued | 프로그램 상세 등 — `variant`/`columnPreset`/`programMode`로 분기 |
| 동등 shared 없음 | raw Ant + `// TODO(custom-ui): …` | `custom-ui-priority.md` |

## Phase 요약

| Phase | 목표 | 시각 |
|-------|------|------|
| 0 | 계약·예외·본 문서 | 동결 |
| 1 | 토큰 SSOT 정리 | 동결 (값 동일) |
| 2 | 저채택 화면 → `Cms*` 패리티 | 패리티 |
| 3 | FilterTableLayout / DetailInfoForm 셸 | 패리티 |
| 4 | feature CSS override 축소 | 동결 |
| 5 | shared/토큰 기본 룩 조정 | **채택률 확보 후에만** |

## Phase 2 우선순위

1. `pages/settlements` (본인 정산)
2. `pages/notices` (사용자 공지)
3. `features/dashboard` (액션 Button → CmsButton)
4. `features/auth` (LoadingButton/CmsButton, 로그인 룩 회귀 시 중단)

## Phase 5 PR 체크리스트 (공통 룩 변경 시)

- [ ] `git diff`에 `apps/platform`, `packages/ui` 없음
- [ ] 변경이 토큰 또는 `shared/*` colocated CSS에만 있음
- [ ] `/design-system` 해당 섹션 확인
- [ ] 대표 프로덕션 3곳: 목록(FilterTableLayout) · 상세폼(DetailInfoForm) · 모달
- [ ] shared면 general + UJAT (+ 영향 시 Gemini) 스모크
- [ ] Not catalogued·미마이그 영역은 “공통 반영 범위 밖”으로 PR에 명시

## 관련 규칙

- [custom-ui-priority.md](../../.cursor/rules/coding/custom-ui-priority.md)
- [program-type-isolation.mdc](../../.cursor/rules/process/program-type-isolation.mdc)
- [styling-tokens.md](../../.cursor/rules/design/styling-tokens.md)
- [numeric-input-ux-audit.md](./numeric-input-ux-audit.md)
- [dashboard-widget-catalog-audit.md](./dashboard-widget-catalog-audit.md) — 대시보드 홈 카탈로그 / Not catalogued

## Phase 3 진행

| 항목 | 상태 |
|------|------|
| `pages/posts/admin-category-page` → FilterTableLayout | 완료 |
| `pages/programs/education-enrollment-page` → FilterTableLayout 셸 | 완료 |
| `pages/education-records/education-record-list-page` (TableFilterGroup → FilterTableLayout 래핑) | 후속 (탭·remote Alert·커스텀 CSS) |
| DetailInfoForm (강사 상세 Descriptions 등) | 후속 (패리티·유형 회귀) |
| 프로그램 유형별 목록 | 유형별 PR + isolation |

## Phase 4 진행

감사 표: [css-override-audit.md](./css-override-audit.md). filter-controls / cms-button `!important` 레이아웃은 유지, danger·brand·table-line hex를 토큰 alias로 정렬(값 동일).

## Phase 5 게이트

공통 룩 변경은 아래가 만족될 때만 허용한다.

1. Phase 2 저채택 축(본인정산·공지·Dashboard 액션·Auth) Current 채택 완료  
2. 대상 primitive의 production 소비가 shared만인 상태  
3. PR에 Phase 5 체크리스트 + Platform/packages diff 0  

룩 변경 요청이 오면 shared/토큰만 수정하고 DS에서 먼저 확인한다. 본 단계에서 **의도적 룩 변경은 하지 않는다**(게이트만 고정).

## Impact audit 스냅샷

채택·커버리지 수치는 SSOT [`apps/cms/src/pages/design-system/data/impact-audit-metrics.ts`](../../src/pages/design-system/data/impact-audit-metrics.ts)에 두고, `/design-system#impact-audit`와 Cursor Canvas `cms-design-system-impact-audit.canvas.tsx`가 동일 스냅샷을 표시한다. 재집계 시 **metrics 파일과 Canvas를 함께** 갱신한다.

에이전트 규칙: [`apps/cms/.cursor/rules/design/design-system-impact-audit.mdc`](../../.cursor/rules/design/design-system-impact-audit.mdc)

**Last updated:** 2026-07-15
