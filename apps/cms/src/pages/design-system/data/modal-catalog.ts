/**
 * CMS shared 모달 카탈로그 — ContentModal 통일 정리용 SSOT
 * 파일 수는 design-system 제외·대략치 (rg 기준, 갱신 시 재집계)
 */

export type ModalCatalogUsage =
  | 'in-use'
  | 'low-usage'
  | 'internal-shell'
  | 'api-only'
  | 'helper'

export type ModalCatalogEntry = {
  name: string
  path: string
  usage: ModalCatalogUsage
  /** design-system 제외 참조 파일 수(대략) */
  filesApprox: number
  basedOn: string
  note: string
  /** ContentModal 통일 시 방향 (삭제는 하지 않음) */
  consolidateHint: string
  /** DS 내 미리보기 가능 여부 */
  previewId?: string
}

export const MODAL_CATALOG_USAGE_LABEL: Record<ModalCatalogUsage, string> = {
  'in-use': '사용 중',
  'low-usage': '사용 중 (소수)',
  'internal-shell': '내부 셸',
  'api-only': 'API 경유',
  helper: '헬퍼',
}

/** 제품에서 쓰이는 모달·오버레이 (shared) */
export const MODAL_CATALOG_IN_USE: ModalCatalogEntry[] = [
  {
    name: 'ContentModal',
    path: 'shared/ui/content-modal',
    usage: 'in-use',
    filesApprox: 165,
    basedOn: 'TealHeaderModal',
    note: '표준 카드형 셸. Wave1–4 카드형 이관 반영.',
    consolidateHint: '목표 표준 — 유지 · full 커스텀은 대상 아님',
    previewId: 'content',
  },
  {
    name: 'ConfirmModal',
    path: 'shared/ui/confirm-modal',
    usage: 'in-use',
    filesApprox: 38,
    basedOn: 'ContentModal',
    note: '확인/취소. danger 시 delete 버튼.',
    consolidateHint: 'ContentModal 래퍼 — 유지',
    previewId: 'confirm',
  },
  {
    name: 'DeleteGuideModal',
    path: 'shared/ui/delete-guide-modal',
    usage: 'in-use',
    filesApprox: 27,
    basedOn: 'ContentModal',
    note: '삭제 안내 · typed confirm 지원.',
    consolidateHint: 'ContentModal 래퍼 — 유지',
    previewId: 'delete-guide',
  },
  {
    name: 'PermissionModal',
    path: 'shared/components/permission-modal',
    usage: 'in-use',
    filesApprox: 34,
    basedOn: 'ContentModal',
    note: '승인/반려/취소(사유·알림).',
    consolidateHint: 'ContentModal 래퍼 — 유지',
    previewId: 'permission',
  },
  {
    name: 'DetailFullPageModal',
    path: 'shared/ui/detail-fullpage-modal',
    usage: 'in-use',
    filesApprox: 12,
    basedOn: 'TealHeaderModal (full)',
    note: '상세 풀페이지 + LNB 옵션.',
    consolidateHint: '풀페이지 전용 — ContentModal과 역할 분리 유지',
    previewId: 'fullpage',
  },
  {
    name: 'ActionResultModal',
    path: 'shared/ui/action-result-modal',
    usage: 'in-use',
    filesApprox: 11,
    basedOn: 'ContentModal',
    note: '등록·삭제 완료 결과.',
    consolidateHint: 'ContentModal 래퍼 — 유지',
    previewId: 'action-result',
  },
  {
    name: 'useCmsAlert / cmsAlertModal',
    path: 'shared/ui/cms-alert-modal-provider · cms-alert-modal-api',
    usage: 'api-only',
    filesApprox: 82,
    basedOn: 'AlertModal → ContentModal',
    note: '단일 확인 안내. AlertModal 직접 마운트 금지.',
    consolidateHint: 'API 유지 · 내부는 ContentModal',
    previewId: 'alert',
  },
  {
    name: 'ProfileEditModal',
    path: 'shared/ui/profile-edit-modal',
    usage: 'in-use',
    filesApprox: 4,
    basedOn: 'ContentModal',
    note: '내 정보 수정 (헤더·마이페이지).',
    consolidateHint: '도메인 ContentModal — 유지',
  },
  {
    name: 'InquiryModal',
    path: 'shared/ui/inquiry-modal',
    usage: 'in-use',
    filesApprox: 3,
    basedOn: 'ContentModal',
    note: '문의 작성 (공지·문의). ContentModal 셸 이관 완료.',
    consolidateHint: '도메인 ContentModal — 유지',
  },
  {
    name: 'ProgramHistoryDeleteBlockedModal',
    path: 'shared/ui/program-history-delete-blocked-modal',
    usage: 'in-use',
    filesApprox: 5,
    basedOn: 'ContentModal',
    note: '프로그램 이력 삭제 불가 안내.',
    consolidateHint: 'ContentModal 래퍼 — 유지',
    previewId: 'history-blocked',
  },
  {
    name: 'TemplateFullpageModal',
    path: 'shared/components/full-page-modal',
    usage: 'in-use',
    filesApprox: 18,
    basedOn: 'TealHeaderModal',
    note: '템플릿 작성/발급 풀페이지 레이아웃.',
    consolidateHint: 'DetailFullPage·템플릿 전용 — 역할 분리',
  },
  {
    name: 'DateTimePickerPopover',
    path: 'shared/components/date-time-picker-modal',
    usage: 'in-use',
    filesApprox: 10,
    basedOn: 'Portal popover (모달 아님)',
    note: '일시 선택 팝오버. PermissionModal 등과 함께 사용.',
    consolidateHint: '오버레이 유지 · ContentModal 대상 아님',
  },
]

/** 소수 사용 · 내부 셸 · ContentModal 통일 후보 (삭제하지 않음) */
export const MODAL_CATALOG_CONSOLIDATE: ModalCatalogEntry[] = [
  {
    name: 'TealHeaderModal',
    path: 'shared/ui/teal-header-modal',
    usage: 'internal-shell',
    filesApprox: 16,
    basedOn: 'antd Modal',
    note: '카드형(ContentModal)·풀페이지(DetailFullPage) 내부 엔진. feature 직접 import ~10은 full+커스텀 크롬만.',
    consolidateHint:
      '카드형 직접 사용은 ContentModal로 이관 완료. full 미리보기·TemplateFullpage·UJAT 뷰어는 Teal 직접 유지. 구현 삭제 금지.',
  },
  {
    name: 'CmsModal',
    path: 'shared/ui/cms-modal',
    usage: 'low-usage',
    filesApprox: 0,
    basedOn: 'ContentModal',
    note: '버튼 1~2개 프리셋. 제품 소비자 0(UJAT 교육지역 → ContentModal/ActionResult). DS만.',
    consolidateHint: '삭제 여부 별도 확인 · 컴포넌트 당분간 유지.',
    previewId: 'cms-modal',
  },
  {
    name: 'AlertModal',
    path: 'shared/ui/alert-modal',
    usage: 'api-only',
    filesApprox: 7,
    basedOn: 'ContentModal',
    note: 'Provider만 마운트. 페이지에서 직접 import 비권장.',
    consolidateHint: 'useCmsAlert 경유 유지 · 컴포넌트 삭제 금지.',
  },
]

/** 본문 헬퍼 (모달 셸은 아님) */
export const MODAL_CATALOG_HELPERS: ModalCatalogEntry[] = [
  {
    name: 'ModalSpecTable',
    path: 'shared/ui/modal-spec-table.tsx',
    usage: 'helper',
    filesApprox: 0,
    basedOn: 'ContentModal 본문',
    note: '라벨·값 2열 표.',
    consolidateHint: '유지',
  },
  {
    name: 'DetailModalSidebar',
    path: 'shared/ui/detail-modal-sidebar',
    usage: 'helper',
    filesApprox: 0,
    basedOn: 'DetailFullPageModal',
    note: '풀페이지 LNB.',
    consolidateHint: '유지',
  },
]

export const ALL_MODAL_CATALOG_ENTRIES: ModalCatalogEntry[] = [
  ...MODAL_CATALOG_IN_USE,
  ...MODAL_CATALOG_CONSOLIDATE,
  ...MODAL_CATALOG_HELPERS,
]
