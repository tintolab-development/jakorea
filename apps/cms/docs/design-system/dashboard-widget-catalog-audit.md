# 대시보드 홈 · Design System 카탈로그 감사

대시보드(`/` ADMIN 홈) 위젯·크롬을 **공통(카탈로그 가능)** vs **Not catalogued(홈 전용)** 로 추린 결과다.  
가짜 shared 컴포넌트를 만들지 않고, presentational·이미 재사용되는 조각만 DS에 올린다.

관련: [cms-shared-ssot-migration.md](./cms-shared-ssot-migration.md), `custom-ui-priority.md`

## 분류 요약

| 분류 | 의미 | DS 대응 |
|------|------|---------|
| **A. DS Catalogued** | presentational, 홈에서 재사용 | `/design-system#dashboard` 데모 |
| **B. Shared Current (타 섹션)** | `shared/ui|components` — 대시보드 소유 아님 | Buttons / Navigation / Feedback / Calendar 등 |
| **C. Presentational (feature-local)** | `features/dashboard` 공통 카드·스켈레톤 — API 없음 | DS 정적 데모 가능 (shared 승격 불필요) |
| **D. Not catalogued** | API·ACL·역할·DnD 결합 위젯 본체 | 카탈로그 금지 — `/`에서만 확인 |
| **E. Raw one-off** | 인라인 ant `Card`+`Statistic` 등 | 후속: C 패턴으로 흡수 권고 |

## A — 이미 DS Catalogued (`#dashboard`)

| 조각 | 경로 |
|------|------|
| `StatisticsCard` | `features/dashboard/ui/statistics-card.tsx` |
| `ProgressStagesWidget` | `features/dashboard/ui/progress-stages-widget.tsx` |
| 테이블형 셸 패턴 | `widget-card` + `WidgetTitleWithHandle` + `dashboard-widget-table` + `widget-more-button` + `ProgramLifecycleStatusText` |
| `PendingActionCard` | `features/dashboard/ui/pending-action-card.tsx` (대기 신청/매칭/정산 카드 공통) |
| `DashboardWidgetSkeleton` | `features/dashboard/ui/dashboard-widget-skeleton.tsx` |

## B — Shared Current (다른 DS 섹션)

| 조각 | DS 섹션 | 대시보드 사용 |
|------|---------|----------------|
| `CmsButton` / `LoadingButton` | Buttons | 더보기·처리하기·툴바 |
| `SegmentedTab` | Navigation | `ProgramScheduleWidget` 월간/주간 |
| `EmptyState` / Spin | Feedback | 홈은 아직 raw `Empty` 비중 큼 |
| `cms-data-table` / `--widget` | Filters & Tables | `ProgramProgressTabsTable` |
| `ContentModal` | Modals | 설정 모달 셸 |
| Calendar primitives | Calendar | 일정 위젯은 **도메인 조합**이라 본체는 D |

## C — Presentational feature-local (카탈로그만, shared 승격 금지)

위젯 **본체**를 shared로 옮기지 않는다. DS에서는 정적 데모만.

| 조각 | 소비처 |
|------|--------|
| `PendingActionCard` | pending-applications/matchings/settlements |
| `DashboardWidgetSkeleton` | registry 로딩 |
| `widget-card.css` / `dashboard-widget-table.css` | 다수 테이블·진행 위젯 |
| `WidgetTitleWithHandle` | DnD 핸들 위치 측정용 — 비주얼만 데모 |

## D — Not catalogued (시스템화하지 않음)

도메인 데이터·역할·설정 store·DnD가 결합된 **위젯 본체·홈 전용 크롬**.

| 레지스트리 / UI | 이유 |
|-----------------|------|
| `ProgramScheduleWidget` ×4 | ACL·유형별 일정 조합 |
| `MenuShortcutWidget` | 메뉴·권한 의존 |
| `KpiAchievementWidget` / `RecruitmentStatusWidget` / `CustomerInquiryStatusWidget` / `LogAlertsWidget` | KPI·API |
| `NotificationWidget` (+ modal/dropdown) | 알림 도메인 |
| `OverallStatisticsCards` / monthly / active / my-* / feeds / pending lists / alert / row | 서비스 바인딩 |
| `ProgramProgressTabsTable` (전체) | 탭+필터+API — 테이블 **셸 패턴만** A |
| `SortableWidgetSlot` / resize / DragOverlay | DnD 크롬 |
| `DashboardToolbar` / `DashboardSettingsModal` | 홈 제품 UX |

## E — Raw one-off → 흡수됨 (2026-07-15)

| 항목 | 조치 |
|------|------|
| `instructor-count-card` 인라인 `Card`+`Statistic` | `StatisticsCard`로 교체 (`tags` optional, `to`로 네비). `onInstructorCardClick` 제거 |

## 레지스트리 ↔ 분류 (요약)

| Registry key | 분류 |
|--------------|------|
| `overall-statistics-cards` | D (카드 단위는 A `StatisticsCard`) |
| `pending-*-card` | D 래퍼 / C `PendingActionCard` |
| `overall-program-progress-card` | D (`ProgressStagesWidget`는 A) |
| `program-progress-tabs-table` | D (셸 패턴 A) |
| `program-schedule-*-widget` | D |
| `menu-shortcut-widget` / `kpi-*` / `recruitment-*` / `customer-inquiry-*` / `log-alerts-*` / `notification-widget` | D |
| `instructor-count-card` | A (`StatisticsCard`, tags 없음) |
| remaining my-/monthly/feed/tasks/alert/row | D |

## 진행 원칙

1. **카탈로그만** — D 위젯을 통째로 DS에 복제하지 않음  
2. **shared 승격은 최후** — C는 feature에 두고 DS 정적 데모로 계약 고정  
3. **룩 변경은 Phase 5** — shared/토큰 SSOT만  
4. Platform·`packages/ui` 제외  

**Last updated:** 2026-07-15
