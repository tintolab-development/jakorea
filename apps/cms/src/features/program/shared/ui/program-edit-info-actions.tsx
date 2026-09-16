import { CmsButton } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
} from '@/features/program/shared/lib/program-edit-info-button'

export interface ProgramEditInfoActionsProps {
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  saving?: boolean
  disabled?: boolean
}

/** 조회/편집 상태 모두 단일 「정보 수정」 버튼을 사용하고 색상으로 동작을 구분한다. */
export function ProgramEditInfoActions({
  isEditing,
  onEdit,
  onSave,
  saving = false,
  disabled = false,
}: ProgramEditInfoActionsProps) {
  return (
    <CmsButton
      {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
      variant={isEditing ? 'secondary' : 'primary'}
      disabled={disabled}
      loading={saving}
      onClick={isEditing ? onSave : onEdit}
      aria-label={PROGRAM_EDIT_INFO_BUTTON_LABEL}
    >
      {PROGRAM_EDIT_INFO_BUTTON_LABEL}
    </CmsButton>
  )
}
