/**
 * CMS Design System · Impact Audit 지표 SSOT
 *
 * - `/design-system#impact-audit` 가 이 파일을 직접 import한다.
 * - Cursor Canvas `cms-design-system-impact-audit.canvas.tsx` 는 동일 스냅샷을
 *   인라인으로 미러한다 (canvas는 repo import 불가). 수치 갱신 시 **둘 다** 맞출 것.
 *
 * 집계 방법: `apps/cms/src` 기준 심볼 언급 파일 수. design-system·test/spec 제외.
 * raw Button/Modal/Empty/Descriptions = antd import 파일 중 `shared/ui|shared/components` 제외.
 * 재집계일: 2026-07-16 (Wave1–4 카드형 ContentModal · Teal full 커스텀 직접 사용 유지)
 */

export const DS_IMPACT_AS_OF = '2026-07-16'

export const DS_IMPACT_AUDIT_METHOD =
  '심볼 파일 수 · apps/cms/src · excl /design-system/ · excl *.test|*.spec'

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
    value: '331',
    label: 'CmsButton 채택 파일',
    tone: 'success',
  },
  {
    value: '33',
    label: '잔여 raw antd Button 소비자 (shared 래퍼 제외)',
    tone: 'warning',
  },
  {
    value: 'Med',
    label: '카드형 ContentModal 이관 완료 · Teal full 커스텀 직접 ~10 유지',
    tone: 'success',
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
    basis: 'FilterTableLayout 66 · cms-data-table 91 · CmsButton',
    verdict: '공통 수정 가능 · education-record FilterTableLayout 반영',
    tone: 'success',
  },
  {
    area: '상세 정보',
    coverage: 'High / Medium',
    basis: 'DetailInfoForm · Descriptions 잔여 10 (my-* Descriptions 이관)',
    verdict: '기본 구조는 가능 · 강사·권한요청·정산 요약 후속',
    tone: 'warning',
  },
  {
    area: '모달',
    coverage: 'High',
    basis:
      'ContentModal 165 · Teal feature 직접 10(full 커스텀 유지) · antd Modal 15 · CmsModal 제품 0',
    verdict: '카드형 표준 High · full 커스텀은 Teal/TemplateFullpage 유지',
    tone: 'success',
  },
  {
    area: '캘린더',
    coverage: 'High',
    basis: 'CalendarMain 25 · SplitCard · Mini',
    verdict: '공통 수정 가능',
    tone: 'success',
  },
  {
    area: '프로그램 상세',
    coverage: 'Medium',
    basis: '공유 셸 + 유형별 CSS/배지/탭 · Teal 풀페이지/프리뷰 잔여',
    verdict: '유형별 검증 필요',
    tone: 'warning',
  },
  {
    area: 'Dashboard',
    coverage: 'Medium+',
    basis: 'EmptyState 31 · 대시보드·my-* Empty→EmptyState 이관 · 위젯 본체 Not catalogued',
    verdict: 'Empty 공통화됨 · 위젯 본체는 홈 전용',
    tone: 'warning',
  },
  {
    area: 'Auth',
    coverage: 'Medium',
    basis: 'SessionWarning → ContentModal · MFA는 커스텀 셸 유지',
    verdict: '세션 경고 이관 · MFA 후속 설계',
    tone: 'warning',
  },
  {
    area: '본인 정산·사용자 공지·my-*',
    coverage: 'Medium / Low',
    basis: 'notices·my-* Modal/Descriptions/Empty 이관 · notification ContentModal',
    verdict: '본인 화면 Wave3 배치 반영 · 강사 pages 후속',
    tone: 'warning',
  },
  {
    area: '게시글·첨부·댓글',
    coverage: 'Medium',
    basis:
      'FileSelectField · AttachmentDownload* · Comment*/Reaction · PostWrite ContentModal',
    verdict: '프리미티브 Current · 셸 일부 이관',
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
  { primitive: 'CmsButton', files: '331', note: '관리·프로그램·모달·error·my-* 페이지' },
  { primitive: 'LoadingButton', files: '48', note: 'Auth·link·대시보드 액션' },
  { primitive: 'FilterTableLayout', files: '66', note: '목록 셸 · education-record 반영' },
  { primitive: 'DetailInfoForm', files: '207', note: 'Descriptions 잔여 후속(강사·권한요청·정산)' },
  { primitive: 'cms-data-table', files: '91', note: '클래스 기준' },
  { primitive: 'ContentModal', files: '165', note: '표준 카드형 · Wave1–4 카드 이관 완료' },
  { primitive: 'PermissionModal', files: '34', note: '승인/반려 · ContentModal 래퍼' },
  { primitive: 'DeleteGuideModal', files: '29', note: '삭제 안내 · ContentModal 래퍼' },
  { primitive: 'TealHeaderModal', files: '16', note: '내부 셸 · feature 직접 10은 full 커스텀 유지' },
  { primitive: 'ConfirmModal', files: '12', note: '확인/취소' },
  { primitive: 'DetailFullPageModal', files: '12', note: '풀페이지 상세' },
  { primitive: 'ActionResultModal', files: '16', note: '작업 완료·설정 불가 안내' },
  { primitive: 'useCmsAlert / cmsAlertModal', files: '85', note: 'AlertModal(ContentModal) API' },
  { primitive: 'CalendarMain', files: '25', note: '일정·스케줄' },
  { primitive: 'ExcelButton', files: '20', note: '목록 툴바 엑셀' },
  { primitive: 'EmptyState', files: '31', note: '대시보드·notices·my-* Empty 이관 반영' },
  { primitive: 'StatisticsCard', files: '6', note: 'instructor-count 흡수 포함' },
  { primitive: 'PendingActionCard', files: '4', note: '대기 카드 패턴' },
  { primitive: 'FileSelectField', files: '9', note: '게시글·공지·출석·상세' },
  {
    primitive: 'AttachmentDownloadList/Icon',
    files: '4 / 7',
    note: '게시글 상세·공지·출석·이전 기수',
  },
  {
    primitive: 'CommentList/Composer · ReactionEmoji',
    files: '4',
    note: 'PostDetailModal 소비 · #posts-attachments',
  },
]

export type DsImpactCommonizationRow = {
  priority: 'P0' | 'P1' | 'P2'
  area: string
  opportunity: string
  leverage: string
  tone: DsImpactTone
}

/**
 * 공통화 가능 영역 (재추려 · 효과 순)
 * — 삭제·강제 이관이 아니라 shared Current로 흡수할 후보
 */
export const DS_IMPACT_COMMONIZATION_ROWS: DsImpactCommonizationRow[] = [
  {
    priority: 'P0',
    area: '모달 셸',
    opportunity:
      'TealHeader feature 직접 잔여 ~10: 전부 full·커스텀 크롬(미리보기·TemplateFullpage·UJAT 뷰어) — ContentModal/DetailFullPage 이관 부적합 · 카드형 이관 완료',
    leverage: 'docs/design-system/wave4-teal-header-review-gate.md',
    tone: 'warning',
  },
  {
    priority: 'P1',
    area: '모달 (antd 직접)',
    opportunity: 'antd Modal 잔여 16 → ContentModal (강사 pages·application·MFA 제외)',
    leverage: '카드형 패딩·푸터 SSOT',
    tone: 'warning',
  },
  {
    priority: 'P1',
    area: '상세 폼',
    opportunity: 'Descriptions 잔여 10 → DetailInfoForm (강사·권한요청·정산 요약)',
    leverage: 'DetailInfoForm 축 확대',
    tone: 'warning',
  },
  {
    priority: 'P2',
    area: '버튼',
    opportunity: 'raw antd Button 33 → CmsButton (application·instructors·program)',
    leverage: 'variant/size 락',
    tone: 'neutral',
  },
  {
    priority: 'P2',
    area: '소수 모달',
    opportunity: 'CmsModal 제품 소비자 0 · 컴포넌트 DS 잔존 · MFA 커스텀 셸 별도 설계',
    leverage: '카드형 단일 진입점',
    tone: 'neutral',
  },
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
    blast: 'CmsButton 331 + LoadingButton 48',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'detail-info-form.css',
    change: '상세 격자·라벨·행 높이',
    blast: 'DetailInfoForm ~207',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'cms-data-table.css',
    change: '테이블 헤더·행·empty·pagination',
    blast: 'cms-data-table ~91',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'filter-table-layout.css',
    change: '목록 필터/툴바 구조',
    blast: 'FilterTableLayout ~65',
    risk: 'High',
    tone: 'warning',
  },
  {
    touchpoint: 'content-modal / teal-header-modal',
    change: '카드형·내부 셸 폭·패딩·푸터',
    blast: 'Content 165 + Teal 16 + Permission/DeleteGuide/Confirm',
    risk: 'High',
    tone: 'warning',
  },
  {
    touchpoint: 'calendar/styles/*',
    change: '월/주 셀·툴팁·split',
    blast: 'CalendarMain ~25+',
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
    change: '대시보드 위젯 본체 · Empty',
    blast: '홈(/)만 · DS는 패턴만',
    risk: 'Local',
    tone: 'neutral',
  },
  {
    touchpoint: 'shared/ui/posts/* · attachment-download',
    change: '댓글·이모지·첨부 다운로드 프리미티브',
    blast: 'PostDetailModal · 공지/출석 첨부',
    risk: 'Medium',
    tone: 'warning',
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
    note: 'education-record FilterTableLayout · my-* Descriptions 이관 · 강사 Descriptions 후속',
    tone: 'warning',
  },
  { phase: '4 override 감사', status: '완료', note: 'css-override-audit.md', tone: 'success' },
  { phase: '5 공통 룩', status: '게이트만', note: '의도적 룩 변경 없음', tone: 'success' },
  {
    phase: '모달 통일',
    status: '카드형 완료',
    note: 'PlainHeader 삭제 · ContentModal 카드 이관 · Teal full 커스텀 직접 유지',
    tone: 'success',
  },
  {
    phase: 'Dashboard E',
    status: '완료',
    note: 'instructor-count → StatisticsCard',
    tone: 'success',
  },
]

export const DS_IMPACT_FOLLOWUPS: string[] = [
  'P0 Wave4 카드형 ContentModal 이관 완료 · 잔여 Teal 직접 ~10은 full 커스텀 유지(이관 대상 아님)',
  'P1 antd Modal 잔여 → ContentModal (강사 pages·application 등 · MFA 제외)',
  'P1 Descriptions 잔여 → DetailInfoForm (instructor·permission-request·정산 요약)',
  'P2 raw Button → CmsButton (application · instructors · program)',
  'MFA 모달: ContentModal 단순 스왑 비권장 · 커스텀 셸 별도 설계',
  'CmsModal: 제품 소비자 0 · DS 카탈로그만 잔존 (삭제 여부 별도 확인)',
]

export const DS_IMPACT_CONCLUSION =
  'Wave4 카드형: 학교 3 + 일반 프로그램 4 → ContentModal. TealHeader 직접 잔여 ~10은 전부 size=full+커스텀 크롬(미리보기·TemplateFullpage·UJAT 뷰어)이라 ContentModal/DetailFullPage로 맞추지 않음. Teal은 shared 내부 엔진으로 유지. Critical 룩은 Phase 5.'

export const DS_IMPACT_NEXT =
  '다음: P1 antd Modal·Descriptions 호출부 이관. Teal full 커스텀은 유지. Phase 5 룩은 게이트 후.'
