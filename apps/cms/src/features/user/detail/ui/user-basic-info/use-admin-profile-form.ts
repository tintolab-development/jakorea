import { useEffect, useMemo } from 'react'
import { Form } from 'antd'
import type { User } from '@/types/user'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  mapAdminProfileFormToBasicInfoDraftPartial,
  mapUserToAdminProfileFormValues,
} from '@/features/user/detail/lib/map-user-to-admin-profile-form'
import type { AdminRegisterModalFormValues } from '@/features/user/shared/ui/admin-register-modal'

export function useAdminProfileForm({
  user,
  mode,
  profileFieldsEditable,
  onMemberInfoDraftChange,
}: {
  user: Omit<User, 'password'>
  mode: 'view' | 'edit'
  profileFieldsEditable: boolean
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
}) {
  const [form] = Form.useForm<AdminRegisterModalFormValues>()
  const initialValues = useMemo(() => mapUserToAdminProfileFormValues(user), [user])

  useEffect(() => {
    if (mode !== 'edit' || !onMemberInfoDraftChange) return
    form.setFieldsValue(initialValues)
    onMemberInfoDraftChange(mapAdminProfileFormToBasicInfoDraftPartial(initialValues))
  }, [form, initialValues, mode, onMemberInfoDraftChange])

  const syncDraftFromForm = (values: AdminRegisterModalFormValues) => {
    if (profileFieldsEditable && onMemberInfoDraftChange) {
      onMemberInfoDraftChange(mapAdminProfileFormToBasicInfoDraftPartial(values))
    }
  }

  return { form, initialValues, syncDraftFromForm }
}
