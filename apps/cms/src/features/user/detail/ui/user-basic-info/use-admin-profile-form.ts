import { useEffect, useMemo, type MutableRefObject } from 'react'
import { Form } from 'antd'
import type { User } from '@/types/user'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  mapAdminProfileFormToBasicInfoDraftPartial,
  mapUserToAdminProfileFormValues,
} from '@/features/user/detail/lib/map-user-to-admin-profile-form'
import type { AdminRegisterModalFormValues } from '@/features/user/shared/ui/admin-register-modal'

export type AdminProfileDraftFlushRef = MutableRefObject<
  (() => Partial<AdminProvisionedMemberBasicInfoDraft>) | null
>

export function useAdminProfileForm({
  user,
  mode,
  profileFieldsEditable,
  onMemberInfoDraftChange,
  draftFlushRef,
}: {
  user: Omit<User, 'password'>
  mode: 'view' | 'edit'
  profileFieldsEditable: boolean
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  /**
   * 저장 직전 폼 값을 draft로 꺼내는 ref. 주면 입력마다 상위 draft를 갱신하지 않는다
   * (키 입력마다 상세 모달 전체가 다시 렌더돼 입력이 버벅이던 문제).
   */
  draftFlushRef?: AdminProfileDraftFlushRef
}) {
  const [form] = Form.useForm<AdminRegisterModalFormValues>()
  const initialValues = useMemo(() => mapUserToAdminProfileFormValues(user), [user])

  useEffect(() => {
    if (mode !== 'edit' || !onMemberInfoDraftChange) return
    form.setFieldsValue(initialValues)
    onMemberInfoDraftChange(mapAdminProfileFormToBasicInfoDraftPartial(initialValues))
  }, [form, initialValues, mode, onMemberInfoDraftChange])

  useEffect(() => {
    if (draftFlushRef == null || mode !== 'edit' || !profileFieldsEditable) return
    const collect = () =>
      mapAdminProfileFormToBasicInfoDraftPartial(
        form.getFieldsValue(true) as AdminRegisterModalFormValues
      )
    draftFlushRef.current = collect
    return () => {
      if (draftFlushRef.current === collect) draftFlushRef.current = null
    }
  }, [draftFlushRef, form, mode, profileFieldsEditable])

  const syncDraftFromForm = (values: AdminRegisterModalFormValues) => {
    if (draftFlushRef != null) return
    if (profileFieldsEditable && onMemberInfoDraftChange) {
      onMemberInfoDraftChange(mapAdminProfileFormToBasicInfoDraftPartial(values))
    }
  }

  return { form, initialValues, syncDraftFromForm }
}
