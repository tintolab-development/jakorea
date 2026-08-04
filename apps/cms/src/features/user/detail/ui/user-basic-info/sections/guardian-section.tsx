import type { User } from '@/types/user'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'

interface GuardianSectionProps {
  user: Omit<User, 'password'>
  personalInfoRevealed: boolean
}

function guardianPhoneView(phone: string | undefined, personalInfoRevealed: boolean) {
  const value = phone?.trim()
  if (!value) return '-'
  return personalInfoRevealed ? value : MASKING_POLICY.phone(value)
}

export function GuardianSection({ user, personalInfoRevealed }: GuardianSectionProps) {
  const shouldShow =
    user.role === 'INDIVIDUAL' && user.under14 === true && user.registeredByAdmin !== true

  if (!shouldShow) return null

  return (
    <DetailInfoForm title="보호자 정보">
      <EditableRow type="double">
        <EditableField
          label="보호자 성명"
          readOnlyDisplay
          view={<span>{user.guardianInfo?.guardianName?.trim() || '-'}</span>}
        />
        <EditableField
          label="가입자와의 관계"
          readOnlyDisplay
          view={<span>{user.guardianInfo?.relation?.trim() || '-'}</span>}
        />
      </EditableRow>
      <EditableRow type="single">
        <EditableField
          label="보호자 연락처"
          readOnlyDisplay
          view={
            <span>{guardianPhoneView(user.guardianInfo?.phone, personalInfoRevealed)}</span>
          }
        />
      </EditableRow>
    </DetailInfoForm>
  )
}
