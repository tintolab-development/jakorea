/**
 * CMS Design System · Impact Audit 지표 SSOT
 *
 * - `/design-system#impact-audit` 가 이 파일을 직접 import한다.
 * - Cursor Canvas `cms-design-system-impact-audit.canvas.tsx` 는 동일 스냅샷을
 *   인라인으로 미러한다 (canvas는 repo import 불가). 수치 갱신 시 **둘 다** 맞출 것.
 *
 * 집계 방법: `apps/cms/src` · PascalCase 심볼 `\bName\b` · `*.{ts,tsx}`만.
 * design-system·test/spec 제외.
 * cms-data-table = 클래스 문자열 (`*.{ts,tsx,css}`).
 * raw Button/Modal/Empty/Descriptions = antd named import · `shared/ui|shared/components` 제외.
 * 재집계일: 2026-08-14 (AlimtalkPhonePreview 카탈로그)
 */

export const DS_IMPACT_AS_OF = '2026-08-14'

export const DS_IMPACT_AUDIT_METHOD =
  '심볼 \\bName\\b · apps/cms/src *.{ts,tsx} · excl /design-system/ · excl *.test|*.spec · cms-data-table=class'

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
    value: '360',
    label: 'CmsButton 채택 파일',
    tone: 'success',
  },
  {
    value: '20',
    label: '잔여 raw antd Button (link/text/Upload·auth mock·e2e·dashed)',
    tone: 'warning',
  },
  {
    value: 'High',
    label: 'Wave F 잔여 패리티 · Teal full 10·MFA 유지',
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
    basis: 'FilterTableLayout 66 · cms-data-table 129 · CmsButton · education-record FilterTableLayout',
    verdict: '공통 수정 가능',
    tone: 'success',
  },
  {
    area: '상세 정보',
    coverage: 'High',
    basis: 'DetailInfoForm 197 · Descriptions 소비자 0 (school-detail Wave F 이관)',
    verdict: '기본 구조 High · Descriptions 잔여 0',
    tone: 'success',
  },
  {
    area: '모달',
    coverage: 'High',
    basis:
      'ContentModal 181 · Teal feature 직접 10 · antd Modal 잔여 MFA+주소검색 nested · CmsModal 제품 0',
    verdict: '카드형 High · full/커스텀 크롬 유지',
    tone: 'success',
  },
  {
    area: '캘린더',
    coverage: 'High',
    basis:
      'CalendarMain 25 · outline 셸 SSOT (Approval+Institution) · EmptyState 캘린더 right',
    verdict: '공통 수정 가능 · outline 배지 셸 통합 완료',
    tone: 'success',
  },
  {
    area: '프로그램 상세',
    coverage: 'Medium',
    basis: '공유 셸 + 유형별 CSS/배지/탭 · Teal 풀페이지/프리뷰 잔여 · CmsTextTabs 32',
    verdict: '유형별 검증 필요',
    tone: 'warning',
  },
  {
    area: 'Dashboard',
    coverage: 'Medium+',
    basis: 'EmptyState 38 · 위젯 본체 Not catalogued',
    verdict: 'Empty 공통화됨 · 위젯 본체는 홈 전용',
    tone: 'warning',
  },
  {
    area: 'Auth',
    coverage: 'Medium',
    basis: 'SessionWarning → ContentModal · MFA 커스텀 · auth mock Button 의도적 잔여',
    verdict: 'MFA·mock Button 의도적 잔여',
    tone: 'warning',
  },
  {
    area: '본인 정산·사용자 공지·my-*',
    coverage: 'Medium / Low',
    basis: 'notices·my-* Modal/Descriptions/Empty 이관 · notification ContentModal',
    verdict: 'Wave3 배치 유지',
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
  {
    area: '상태 배지',
    coverage: 'High',
    basis:
      'StatusDropdownCell 41 · tag100 단일 스펙(116·pad7·gap8) · INLINE_TAG100 셸 10 · chrome=hug 제거',
    verdict: '테이블·폼/상세 상태변경 UI 통일 · 밀림은 INLINE 셸',
    tone: 'success',
  },
]

export type DsImpactAdoptionRow = {
  primitive: string
  files: string
  note: string
}

/** Current 채택 스냅샷 */
export const DS_IMPACT_ADOPTION_ROWS: DsImpactAdoptionRow[] = [
  { primitive: 'CmsButton', files: '360', note: 'Wave F 폼·액션 이관 · link/text/Upload/auth mock 잔여' },
  { primitive: 'LoadingButton', files: '47', note: 'Auth·link·대시보드 액션' },
  { primitive: 'FilterTableLayout', files: '66', note: '목록 셸 · education-record 완료' },
  { primitive: 'DetailInfoForm', files: '197', note: 'Wave F · school-detail 포함 · Descriptions 0' },
  { primitive: 'cms-data-table', files: '129', note: '클래스 기준 (ts/tsx/css)' },
  { primitive: 'ContentModal', files: '181', note: 'Wave C 카드형 이관 · MFA·주소 nested 제외' },
  { primitive: 'PermissionModal', files: '34', note: '승인/반려 · ContentModal 래퍼' },
  { primitive: 'DeleteGuideModal', files: '27', note: '삭제 안내 · ContentModal 래퍼' },
  { primitive: 'TealHeaderModal', files: '19', note: '내부 셸 · feature 직접 10은 full 커스텀 유지' },
  { primitive: 'ConfirmModal', files: '9', note: 'shared ConfirmModal import' },
  { primitive: 'DetailFullPageModal', files: '12', note: '풀페이지 상세' },
  { primitive: 'ActionResultModal', files: '15', note: '작업 완료·설정 불가 안내' },
  { primitive: 'useCmsAlert / cmsAlertModal', files: '104', note: 'AlertModal(ContentModal) API · 유니크 파일' },
  { primitive: 'CalendarMain', files: '25', note: '일정·스케줄' },
  { primitive: 'CalendarApprovalStatusBadge', files: '5', note: 'outline 셸 SSOT 공유' },
  { primitive: 'InstitutionApplicationStatusBadge', files: '2', note: 'outline 셸 SSOT 공유' },
  { primitive: 'ExcelButton', files: '21', note: '목록 툴바 엑셀' },
  { primitive: 'EmptyState', files: '38', note: 'Wave D · antd Empty 소비자 0' },
  { primitive: 'CmsTextTabs', files: '32', note: '민트 밑줄 텍스트 탭 · 프로그램 상세·목록' },
  { primitive: 'StatisticsCard', files: '6', note: 'instructor-count 흡수 포함' },
  { primitive: 'PendingActionCard', files: '4', note: '대기 카드 패턴' },
  { primitive: 'FileSelectField', files: '9', note: '게시글·공지·출석·상세' },
  {
    primitive: 'AttachmentDownloadList/Icon',
    files: '4 / 7',
    note: '게시글 상세·공지·출석·이전 기수',
  },
  {
    primitive: 'CommentList/Composer · ReactionEmojiPicker · ReactionUserList',
    files: '4 / 4 / 4 / 4',
    note: 'PostDetailModal 소비 · #posts-attachments',
  },
  {
    primitive: 'StatusDropdownCell',
    files: '41',
    note: 'tag100 단일 크롬 · INLINE_TAG100 폼/상세·교재명 · Editable/Textbook 등',
  },
  {
    primitive: 'AlimtalkPhonePreview',
    files: '2',
    note: '템플릿 미리보기 · 발송 풀페이지 · #alimtalk-phone',
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
 * — Wave F 이후 잔여
 */
export const DS_IMPACT_COMMONIZATION_ROWS: DsImpactCommonizationRow[] = [
  {
    priority: 'P0',
    area: '모달 셸',
    opportunity:
      'TealHeader feature 직접 잔여 10: full·커스텀 크롬 유지 — ContentModal/DetailFullPage 이관 부적합',
    leverage: 'docs/design-system/wave4-teal-header-review-gate.md',
    tone: 'warning',
  },
  {
    priority: 'P2',
    area: '버튼',
    opportunity:
      'raw Button 20 → 의도적 잔여 (auth mock·link/text·Upload·dashed·e2e·mypage 타일)',
    leverage: 'variant 확장 시 Phase 5 게이트 · LoadingButton 유지',
    tone: 'neutral',
  },
  {
    priority: 'P2',
    area: '소수 모달',
    opportunity:
      'MFA 커스텀 셸 · add-instructor 주소검색 nested Modal · CmsModal 제품 0',
    leverage: '단순 ContentModal 스왑 비권장',
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
    blast: 'CmsButton 360 + LoadingButton 47',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'detail-info-form.css',
    change: '상세 격자·라벨·행 높이',
    blast: 'DetailInfoForm ~197',
    risk: 'Critical',
    tone: 'danger',
  },
  {
    touchpoint: 'cms-data-table.css',
    change: '테이블 헤더·행·empty·pagination',
    blast: 'cms-data-table ~129',
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
    change: '카드형·내부 셸 폭·패딩·푸터',
    blast: 'Content 181 + Teal 19 + Permission/DeleteGuide/Confirm',
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
    touchpoint: 'calendar/.../calendar-outline-status-badge.css',
    change: '캘린더 우측 outline 배지 셸',
    blast: 'CalendarApproval 5 + InstitutionApplication 2',
    risk: 'Medium',
    tone: 'warning',
  },
  {
    touchpoint: 'status-dropdown-cell.css / .tsx',
    change: '상태변경 드롭다운 크롬(tag100·160·paymentOrderLine · INLINE 셸)',
    blast: 'StatusDropdownCell ~41 · 폼 INLINE_TAG100 ~10',
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
  {
    touchpoint: 'alimtalk-phone-preview.css',
    change: '알림톡 휴대폰 프레임·버블 타이포',
    blast: '템플릿 미리보기 · 알림톡 발송 풀페이지 · /design-system#alimtalk-phone',
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
    status: '완료',
    note: 'education-record FilterTableLayout · Descriptions→DetailInfoForm (잔여 0)',
    tone: 'success',
  },
  { phase: '4 override 감사', status: '완료', note: 'css-override-audit.md', tone: 'success' },
  { phase: '5 공통 룩', status: '게이트만', note: '의도적 룩 변경 없음', tone: 'success' },
  {
    phase: '모달 통일',
    status: '카드형 완료',
    note: 'ContentModal 181 · Teal full 10 · MFA·주소 nested 유지',
    tone: 'success',
  },
  {
    phase: 'Wave A outline 배지',
    status: '완료',
    note: 'calendar-outline-status-badge.css 셸 SSOT',
    tone: 'success',
  },
  {
    phase: 'Wave B–E',
    status: '완료',
    note: 'Descriptions·Modal·Empty·Button 안전 이관',
    tone: 'success',
  },
  {
    phase: 'Wave F 잔여 패리티',
    status: '완료',
    note: 'school-detail DetailInfoForm · raw Button 27→20 안전 이관',
    tone: 'success',
  },
  {
    phase: 'StatusDropdown 크롬 통일',
    status: '완료',
    note: 'chrome=hug 제거 · tag100 단일(116·7·8) · INLINE_TAG100 밀림 방지',
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
  'P0 Teal full 직접 10 유지 (이관 대상 아님)',
  'P2 raw Button 20 의도적 잔여 (auth mock · link/text · Upload · dashed · e2e · mypage 타일)',
  'MFA 모달 · add-instructor 주소검색 nested Modal: ContentModal 단순 스왑 비권장',
  'CmsModal: 제품 소비자 0 · DS 카탈로그만 잔존',
  'Phase 5 Critical 룩: 게이트 충족 전 금지',
]

export const DS_IMPACT_CONCLUSION =
  'StatusDropdownCell tag100 크롬 통일(chrome=hug 제거). ContentModal 181 · DetailInfoForm 197 · EmptyState 38 · CmsButton 360 · StatusDropdown 41. antd Empty 0 · Descriptions 0 · raw Button 20(의도적). Teal full 10·Phase 5 룩은 동결.'

export const DS_IMPACT_NEXT =
  '다음: Phase 5는 게이트 후 · StatusDropdown 새 도메인은 tag100/tag160+INLINE 셸 · Teal/MFA 유지.'
