import {
  AdminContentModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS,
  type AdminContentModalProps,
} from '@jakorea/admin-ui/modal'

export { CONTENT_MODAL_FOOTER_START_CLASS, CONTENT_MODAL_TABLE_CELL_ACTIONS_CLASS }
export type ContentModalProps = AdminContentModalProps

/** `@jakorea/admin-ui` modal-size.ts `ADMIN_MODAL_SIZE_WIDTH`와 동일 (패키지 미노출) */
const MODAL_SIZE_WIDTH: Record<NonNullable<AdminContentModalProps['size']>, number> = {
  compact: 600,
  default: 800,
  medium: 1000,
  wide: 1200,
  large: 1400,
}

/**
 * 실제 팝업 폭 1000 미만 — 세로형 표를 Table / Vertical / Cell / Small 로 그린다
 * (`detail-info-form-modal.css`). `size` 대신 `width`를 직접 넘긴 팝업(예: 내 정보 확인 1200)도
 * 실제 폭 기준으로 판단해야 해서 크기 클래스(`teal-header-modal--default`)가 아닌 이 클래스를 쓴다.
 */
export const NARROW_MODAL_CLASS = 'content-modal--narrow'
const NARROW_MODAL_MAX_WIDTH_EXCLUSIVE = 1000

export function ContentModal({ className, size, width, ...rest }: ContentModalProps) {
  const resolvedWidth = width ?? MODAL_SIZE_WIDTH[size ?? 'default']
  const narrow = resolvedWidth < NARROW_MODAL_MAX_WIDTH_EXCLUSIVE
  return (
    <AdminContentModal
      {...rest}
      size={size}
      width={width}
      className={[className, narrow ? NARROW_MODAL_CLASS : ''].filter(Boolean).join(' ') || undefined}
    />
  )
}
