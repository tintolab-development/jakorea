import { useMemo } from 'react'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'

export interface BasicInfoEditingParams {
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  cmsMayEditBasicProfileFields: boolean
}

export function useBasicInfoEditing(params: BasicInfoEditingParams) {
  const {
    memberInfoEditing = false,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  } = params

  return useMemo(() => {
    const isEditing = Boolean(memberInfoEditing && memberInfoDraft && onMemberInfoDraftChange)
    const canEditBasic = isEditing && cmsMayEditBasicProfileFields
    const isReadOnlyDisplay = isEditing && !cmsMayEditBasicProfileFields

    return {
      isEditing,
      canEditBasic,
      isReadOnlyDisplay,
      isFieldEditable: (fieldPolicy: 'basic' | 'always' = 'basic') => {
        if (fieldPolicy === 'always') return isEditing
        return canEditBasic
      },
    }
  }, [memberInfoEditing, memberInfoDraft, onMemberInfoDraftChange, cmsMayEditBasicProfileFields])
}
