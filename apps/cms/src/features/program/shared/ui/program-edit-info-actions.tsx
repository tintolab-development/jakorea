import { CmsButton, FilterTableToolbarButton, type CmsButtonSize } from '@/shared/ui'
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
  idleVariant?: 'primary' | 'secondary'
  /** FilterTableLayout 툴바 등 h40 SSOT */
  useToolbarButton?: boolean
  /** 미지정 시 large(h44). 상세 탭 액션은 h40 */
  size?: CmsButtonSize
}

/** 조회/편집 상태 모두 단일 「정보 수정」 버튼을 사용하고 색상으로 동작을 구분한다. */
export function ProgramEditInfoActions({
  isEditing,
  onEdit,
  onSave,
  saving = false,
  disabled = false,
  idleVariant = 'secondary',
  useToolbarButton = false,
  size,
}: ProgramEditInfoActionsProps) {
  const resolvedVariant = isEditing ? 'secondary' : idleVariant
  const shared = {
    variant: resolvedVariant,
    disabled,
    loading: saving,
    onClick: isEditing ? onSave : onEdit,
    'aria-label': PROGRAM_EDIT_INFO_BUTTON_LABEL,
    children: PROGRAM_EDIT_INFO_BUTTON_LABEL,
  }

  if (useToolbarButton) {
    return <FilterTableToolbarButton {...shared} />
  }

  const resolvedSize = size ?? PROGRAM_EDIT_INFO_BUTTON_PROPS.size

  return (
    <CmsButton
      size={resolvedSize}
      {...shared} />
  )
}
