import { CmsButton, FilterTableToolbarButton, type CmsButtonSize } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  PROGRAM_EDIT_INFO_CANCEL_LABEL,
  PROGRAM_EDIT_INFO_SAVE_LABEL,
} from '@/features/program/shared/lib/program-edit-info-button'
import { showAdminAccessDeniedAlert } from '@/shared/lib/admin-role-policy'
import './program-edit-info-actions.css'

export interface ProgramEditInfoActionsProps {
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  saving?: boolean
  disabled?: boolean
  idleVariant?: 'primary' | 'secondary'
  /** FilterTableLayout 툴바 등 h40 SSOT */
  useToolbarButton?: boolean
  /** 미지정 시 large(h44). 상세 탭 액션은 h40 */
  size?: CmsButtonSize
  /**
   * false면 「정보 수정」을 노출하되 클릭 시 접근 불가 안내만 띄운다(권한 설정 V1.2 — 숨김·비활성화 대신 안내).
   * 프로그램 상세 안에서는 `ProgramDetailActionGuard`가 먼저 가로채며, 이 값은 그 밖의 진입 보호용이다.
   */
  canWrite?: boolean
  /** 조회 상태 버튼 문구. 미지정 시 「정보 수정」 */
  editLabel?: string
  /** 수정 상태 저장 버튼 문구. 미지정 시 「저장」 */
  saveLabel?: string
  /** 화면 정책상 정보 수정을 제공하지 않을 때만 true(권한과 무관). */
  hidden?: boolean
}

/** 조회: 「정보 수정」 / 수정: 「취소」「저장」만 조건부 렌더 */
export function ProgramEditInfoActions({
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving = false,
  disabled = false,
  idleVariant = 'secondary',
  useToolbarButton = false,
  size,
  canWrite = true,
  editLabel = PROGRAM_EDIT_INFO_BUTTON_LABEL,
  saveLabel = PROGRAM_EDIT_INFO_SAVE_LABEL,
  hidden = false,
}: ProgramEditInfoActionsProps) {
  const resolvedSize = size ?? PROGRAM_EDIT_INFO_BUTTON_PROPS.size
  if (hidden) return null
  const handleEdit = () => {
    if (!canWrite) {
      showAdminAccessDeniedAlert()
      return
    }
    onEdit()
  }

  if (!isEditing) {
    if (useToolbarButton) {
      return (
        <FilterTableToolbarButton
          variant={idleVariant}
          disabled={disabled}
          onClick={handleEdit}
          aria-label={editLabel} >
          {editLabel}
        </FilterTableToolbarButton>
      )
    }

    return (
      <CmsButton
        size={resolvedSize}
        variant={idleVariant}
        disabled={disabled}
        onClick={handleEdit}
        aria-label={editLabel} >
        {editLabel}
      </CmsButton>
    )
  }

  if (useToolbarButton) {
    return (
      <span className="program-edit-info-actions">
        <FilterTableToolbarButton
          variant="secondary"
          disabled={disabled || saving}
          onClick={onCancel}
          aria-label={PROGRAM_EDIT_INFO_CANCEL_LABEL} >
          {PROGRAM_EDIT_INFO_CANCEL_LABEL}
        </FilterTableToolbarButton>
        <FilterTableToolbarButton
          variant="primary"
          disabled={disabled}
          loading={saving}
          onClick={onSave}
          aria-label={saveLabel} >
          {saveLabel}
        </FilterTableToolbarButton>
      </span>
    )
  }

  return (
    <span className="program-edit-info-actions">
      <CmsButton
        size={resolvedSize}
        variant="secondary"
        disabled={disabled || saving}
        onClick={onCancel}
        aria-label={PROGRAM_EDIT_INFO_CANCEL_LABEL} >
        {PROGRAM_EDIT_INFO_CANCEL_LABEL}
      </CmsButton>
      <CmsButton
        size={resolvedSize}
        variant="primary"
        disabled={disabled}
        loading={saving}
        onClick={onSave}
        aria-label={saveLabel} >
        {saveLabel}
      </CmsButton>
    </span>
  )
}
