/**
 * CMS Design System · Impact Audit 지표 SSOT
 *
 * - `/design-system#impact-audit` 가 이 파일을 직접 import한다.
 * - Cursor Canvas `cms-design-system-impact-audit.canvas.tsx` 는 동일 스냅샷을
 *   인라인으로 미러한다 (canvas는 repo import 불가). 수치 갱신 시 **둘 다** 맞출 것.
 *
 * 집계 방법: `apps/cms/src` 기준 ripgrep 파일 수. design-system·test/spec 제외.
 * raw Button 소비자 = antd Button import 파일 중 `shared/ui|shared/components` 제외.
 */

export const DS_IMPACT_AS_OF = '2026-07-15'

export const DS_IMPACT_AUDIT_METHOD =
  'rg 파일 수 · apps/cms/src · excl /design-system/ · excl *.test|*.spec'

export type DsImpactTone = 'success' | 'warning' | 'danger' | 'neutral'

export type DsImpactStat = {
  value: string
  label: string
  tone: DsImpactTone
}

/** 상단 KPI */
export const DS_IMPACT_STATS: DsImpactStat[] = [
  {
    value: 'Phase 0–5',
    label: '마이그 게이트 완료 (룩 변경은 Phase 5 조건 충족 시에만)',
    tone: 'success',
  },
  {
    value: '319',
    label: 'CmsButton 채택 파일',
    tone: 'success',
  },
  {
    value: '42',
    label: '잔여 raw antd Button 소비자 (shared 래퍼 제외)',
    tone: 'warning',
  },
  {
    value: 'High→Med',
    label: '목록·모달·캘린더 High / Dashboard·Auth Medium / 도메인·my-* 잔여',
    tone: 'warning',
  },
]

export type DsImpactCoverageRow = {
  area: string
  coverage: string
  basis: string
  verdict: string
  tone: DsImpactTone
}

/** 영역별 커버리지 */
export const DS_IMPACT_COVERAGE_ROWS: DsImpactCoverageRow[] = [
  {
    area: '관리 목록',
    coverage: 'High',
    basis: 'FilterTableLayout 66 · cms-data-table 92 · CmsButton',
    verdict: '공통 수정 가능',
    tone: 'success',
  },
  {
    area: '상세 정보',
    coverage: 'High / Medium',
    basis: 'DetailInfoForm 180 · 로컬 CSS·Descriptions 잔여',
    verdict: '기본 구조는 가능',
    tone: 'warning',
  },
  {
    area: '모달',
    coverage: 'High',
    basis: 'ContentModal 146 · TealHeader 24 · Confirm 48',
    verdict: '공통 수정 가능',
    tone: 'success',
  },
  {
    area: '캘린더',
    coverage: 'High',
    basis: 'CalendarMain 35 · SplitCard · Mini',
    verdict: '공통 수정 가능',
    tone: 'success',
  },
  {
    area: '프로그램 상세',
    coverage: 'Medium',
    basis: '공유 셸 + 유형별 CSS/배지/탭',
    verdict: '유형별 검증 필요',
    tone: 'warning',
  },
  {
    area: 'Dashboard',
    coverage: 'Medium+',
    basis:
      '액션 Cms/LoadingButton · StatisticsCard(강사수 흡수) · 위젯 본체 Not catalogued · raw Empty 다수',
    verdict: '패턴만 공통 · 본체는 홈 전용',
    tone: 'warning',
  },
  {
    area: 'Auth',
    coverage: 'Medium',
    basis: 'LoadingButton 24 · CmsButton 2 · pages/auth mock·로그인 raw Button 잔여',
    verdict: '폼 셸은 부분 반영',
    tone: 'warning',
  },
  {
    area: '본인 정산·사용자 공지',
    coverage: 'Medium',
    basis: 'Phase 2 CmsButton 채택 · FilterTableLayout 미채택(정산)',
    verdict: '버튼 공통화됨 · 셸 후속',
    tone: 'warning',
  },
]

export type DsImpactAdoptionRow = {
  primitive: string
  files: string
  note: string
}

/** Current 채택 스냅샷 */
export const DS_IMPACT_ADOPTION_ROWS: DsImpactAdoptionRow[] = [
  { primitive: 'CmsButton', files: '319', note: '관리·프로그램·모달 주력' },
  { primitive: 'LoadingButton', files: '44', note: 'Auth·link·대시보드 액션' },
  { primitive: 'FilterTableLayout', files: '66', note: '목록 셸 · education-record 후속' },
  { primitive: 'DetailInfoForm', files: '180', note: 'Descriptions 잔여 후속' },
  { primitive: 'cms-data-table', files: '92', note: '클래스 기준' },
  { primitive: 'ContentModal', files: '146', note: '표준 컨텐츠 모달' },
  { primitive: 'TealHeaderModal', files: '24', note: '틸 헤더 변형' },
  { primitive: 'ConfirmModal', files: '48', note: '확인/삭제 가이드' },
  { primitive: 'CalendarMain', files: '35', note: '일정·스케줄' },
  { primitive: 'EmptyState', files: '11', note: '대시보드 raw Empty 대비 낮음' },
  { primitive: 'StatisticsCard', files: '8', note: 'instructor-count 흡수 포함' },
  { primitive: 'PendingActionCard', files: '4', note: '대기 카드 패턴' },
]

export type DsImpactTouchpointRow = {
  touchpoint: string
  change: string
  blast: string
  risk: string
  tone: DsImpactTone
}

export const DS_IMPACT_TOUCHPOINT_ROWS: DsImpactTouchpointRow[] = [
  {
    touchpoint: 'theme-provider.css / .tsx',
    change: '색·간격·radius·Ant 기본값',
    blast: '전역',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'cms-button.css',
    change: '버튼 variant·크기',
    blast: 'CmsButton 319 + LoadingButton 44',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'detail-info-form.css',
    change: '상세 격자·라벨·행 높이',
    blast: 'DetailInfoForm ~180',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'cms-data-table.css',
    change: '테이블 헤더·행·empty·pagination',
    blast: 'cms-data-table ~92',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'filter-table-layout.css',
    change: '목록 필터/툴바 구조',
    blast: 'FilterTableLayout ~66',
    risk: 'High',
    tone: 'warning',
  },
  {
    touchpoint: 'content-modal / teal-header-modal',
    change: '일반 모달 폭·높이·스크롤',
    blast: 'Content 146 + Teal 24 + Confirm 48',
    risk: 'High',
    tone: 'warning',
  },
  {
    touchpoint: 'calendar/styles/*',
    change: '월/주 셀·툴팁·split',
    blast: 'CalendarMain ~35+',
    risk: 'High',
    tone: 'warning',
  },
  {
    touchpoint: 'pages/design-system/page.css',
    change: 'DS 데모 배치·보정',
    blast: '/design-system만',
    risk: 'Local',
    tone: 'neutral',
  },
  {
    touchpoint: 'features/dashboard/ui/*',
    change: '대시보드 위젯 본체',
    blast: '홈(/)만 · DS는 패턴만',
    risk: 'Local',
    tone: 'neutral',
  },
]

export type DsImpactPhaseRow = {
  phase: string
  status: string
  note: string
  tone: DsImpactTone
}

export const DS_IMPACT_PHASE_ROWS: DsImpactPhaseRow[] = [
  { phase: '0 계약·예외', status: '완료', note: 'cms-shared-ssot-migration.md', tone: 'success' },
  { phase: '1 토큰 SSOT', status: '완료', note: '시각 동결 · alias', tone: 'success' },
  { phase: '2 Cms* 채택', status: '완료', note: '정산·공지·Dashboard·Auth 패리티', tone: 'success' },
  {
    phase: '3 목록·폼 셸',
    status: '부분',
    note: 'admin-category·education-enrollment 완료 · education-record·DetailInfoForm 후속',
    tone: 'warning',
  },
  { phase: '4 override 감사', status: '완료', note: 'css-override-audit.md', tone: 'success' },
  { phase: '5 공통 룩', status: '게이트만', note: '의도적 룩 변경 없음', tone: 'success' },
  {
    phase: 'Dashboard E',
    status: '완료',
    note: 'instructor-count → StatisticsCard',
    tone: 'success',
  },
]

export const DS_IMPACT_FOLLOWUPS: string[] = [
  '대시보드 raw antd Empty → EmptyState (EmptyState 채택 11 vs raw Empty 다수)',
  'education-record-list-page → FilterTableLayout 래핑 (TableFilterGroup 잔여 ~15)',
  '강사 상세 등 Descriptions → DetailInfoForm (패리티·유형 회귀)',
  '잔여 raw Button 소비자 ~42 (application·certificate·my-*·instructor pages 등)',
]

export const DS_IMPACT_CONCLUSION =
  '디자인 시스템 페이지는 전역 스타일 원본이 아니다. 제품 룩 SSOT는 theme-provider + shared/* 이며, /design-system은 동일 Current를 검증한다. Phase 0–5 게이트와 저채택 축(정산·공지·Dashboard 액션·Auth) 버튼 채택은 반영됐다. 관리 목록·모달·캘린더는 공통 수정 가능성이 높고, 프로그램 유형 상세·Dashboard 위젯 본체·Auth 폼·my-* 잔여는 로컬/도메인 구현이 남아 일괄 반영되지 않는다.'

export const DS_IMPACT_NEXT =
  '공통화 효과가 큰 순서는 토큰·shared 유지 → EmptyState/FilterTableLayout 후속 → DetailInfoForm 잔여. 공통 룩(Phase 5)은 채택률·체크리스트 충족 후에만 shared/토큰에서 조정한다.'
