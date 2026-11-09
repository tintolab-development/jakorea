/**
 * 권한 설정 V1.2 홈페이지 어드민 — Program Viewer는 모든 화면(로그 관리 제외)을 조회만 한다.
 * 등록·수정·삭제·신청 확인·설정 버튼과 신청자 첨부 다운로드는 숨기지 않고 노출하며, 클릭하면 접근 불가 안내를 띄운다.
 * CMS `ProgramDetailActionGuard`와 같은 방식으로 콘텐츠 영역 루트에서 클릭을 가로챈다.
 *
 * 판정 순서: `data-homepage-action` 속성 → 스위치(role="switch") → 버튼 라벨(aria-label → 텍스트).
 */
export type HomepageActionKind = 'write' | 'pii' | 'download'

export interface HomepageActionPermissions {
  write: boolean
  pii: boolean
  /** 신청 목록(인재채용 지원·기업 후원 상담·재능기부 신청) 엑셀 — 신청자 개인정보가 담겨 HOMEPAGE_PII_VIEW 기준 */
  download: boolean
}

/** 라벨로 판정되지 않는 버튼은 `write|pii`로 지정하고, 조회 버튼이 걸리면 `allow`로 뺀다. */
export const HOMEPAGE_ACTION_ATTRIBUTE = 'data-homepage-action'

/** BE `HomepagePermission` — 쓰기는 HOMEPAGE_EDIT, 신청자 개인정보·첨부는 HOMEPAGE_PII_VIEW. */
export const HOMEPAGE_EDIT_PERMISSION = 'HOMEPAGE_EDIT'
export const HOMEPAGE_PII_VIEW_PERMISSION = 'HOMEPAGE_PII_VIEW'

const ACTION_KINDS = new Set<string>(['write', 'pii', 'download'])

const WRITE_LABELS = new Set<string>([
  '수정',
  '저장',
  '등록',
  '삭제',
  '추가',
  '신청 확인',
  '순서 변경',
])

/** `선택 삭제`·`선택 확인` 등 선택 행 일괄 처리. */
const WRITE_LABEL_PREFIX = '선택 '

/** `공지사항 등록`·`신청 삭제`·`항목 수정`·`이미지 업로드` 등 대상 + 동작 라벨. */
const WRITE_LABEL_SUFFIXES = [
  ' 등록',
  ' 삭제',
  ' 수정',
  ' 추가',
  ' 저장',
  ' 변경',
  ' 업로드',
] as const

const INTERACTIVE_SELECTOR = 'button, a[href], [role="button"], [role="menuitem"], [role="switch"]'

/** 화면 이동(탭)은 조회라 막지 않는다. */
const NAVIGATION_SELECTOR = '[role="tab"]'

/**
 * 권한 설정 V1.2 '신청 목록 다운로드': Master·Accounting Manager·Program Manager 허용, Program Viewer 제한.
 * 엑셀 버튼(`ExcelButton`)만 대상이다. 콘텐츠 첨부 파일 다운로드는 Program Viewer도 허용(BE HOMEPAGE_VIEW)이라 막지 않는다.
 */
const EXCEL_DOWNLOAD_SELECTOR = '.excel-button'
const EXCEL_DOWNLOAD_LABEL = '엑셀 다운로드'

/** 드래그 순서 변경 핸들 — 클릭이 아니라 pointerdown/keydown으로 시작한다. */
const DRAG_HANDLE_SELECTOR = '.sort-order-drag-handle, [aria-label="순서 변경"]'

export function normalizeHomepageActionLabel(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim()
}

export function classifyHomepageActionLabel(
  raw: string | null | undefined
): HomepageActionKind | null {
  const label = normalizeHomepageActionLabel(raw)
  if (!label) return null
  if (
    WRITE_LABELS.has(label) ||
    label.startsWith(WRITE_LABEL_PREFIX) ||
    WRITE_LABEL_SUFFIXES.some(suffix => label.endsWith(suffix))
  ) {
    return 'write'
  }
  return null
}

function closestControl(target: EventTarget | null): Element | null {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return null
  return target.closest(INTERACTIVE_SELECTOR)
}

/** 클릭 대상에서 가장 가까운 버튼의 액션 종류. 조회·닫기·탭 이동 등은 null. */
export function resolveHomepageActionKind(target: EventTarget | null): HomepageActionKind | null {
  const control = closestControl(target)
  if (!control) return null
  if (control.closest(NAVIGATION_SELECTOR)) return null
  const explicit = control
    .closest(`[${HOMEPAGE_ACTION_ATTRIBUTE}]`)
    ?.getAttribute(HOMEPAGE_ACTION_ATTRIBUTE)
  if (explicit === 'allow') return null
  if (explicit && ACTION_KINDS.has(explicit)) return explicit as HomepageActionKind
  if (
    control.closest(EXCEL_DOWNLOAD_SELECTOR) ||
    normalizeHomepageActionLabel(control.textContent) === EXCEL_DOWNLOAD_LABEL
  ) {
    return 'download'
  }
  // 목록의 공개·사용 여부 스위치는 누르는 즉시 저장된다.
  if (control.getAttribute('role') === 'switch') return 'write'
  return (
    classifyHomepageActionLabel(control.getAttribute('aria-label')) ??
    classifyHomepageActionLabel(control.textContent)
  )
}

/** 드래그 순서 변경 핸들이면 true — 드래그 시작(pointerdown/keydown)을 막을 때 쓴다. */
export function isHomepageDragHandleTarget(target: EventTarget | null): boolean {
  const control = closestControl(target)
  return Boolean(control?.closest(DRAG_HANDLE_SELECTOR))
}

/**
 * `GET /api/admin/me` 응답(roleCode·permissions)으로 판정한다.
 * 프로필을 아직 못 받았으면 막지 않는다(서버가 최종 판정).
 */
export function resolveHomepageActionPermissions(input: {
  resolved: boolean
  roleCode?: string | null
  permissions?: readonly string[] | null
}): HomepageActionPermissions {
  if (!input.resolved) return { write: true, pii: true, download: true }
  if ((input.roleCode ?? '').trim().toUpperCase() === 'MASTER') {
    return { write: true, pii: true, download: true }
  }
  const codes = new Set((input.permissions ?? []).map(code => code.trim().toUpperCase()))
  return {
    write: codes.has(HOMEPAGE_EDIT_PERMISSION),
    pii: codes.has(HOMEPAGE_PII_VIEW_PERMISSION),
    download: codes.has(HOMEPAGE_PII_VIEW_PERMISSION),
  }
}
