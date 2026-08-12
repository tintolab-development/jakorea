import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import { buildConfirmationRows } from '@/features/auth/sign-up'
import { MOCK_ADMIN_REGISTERED_PROFILE } from './constants'
import type { AdminRegisteredWizardState } from './wizard-state'
import { getAdminRegisteredProfileFields } from './wizard-state'

export function buildAdminRegisteredConfirmationRows(state: AdminRegisteredWizardState) {
  const profile = getAdminRegisteredProfileFields(state)

  return buildConfirmationRows({
    selectedType: MOCK_ADMIN_REGISTERED_PROFILE.memberType,
    birthDate: state.birthDate ?? '',
    gender: state.gender ?? null,
    schoolStatus: profile.schoolStatus,
    address: profile.address,
    addressDetail: profile.addressDetail,
    email: state.email,
    volunteerId: profile.volunteerId,
  })
}

export function isAdminRegisteredEditValid(state: {
  schoolStatus: 'enrolled' | 'none'
  schoolName: string
  grade: string
  address: string
  addressDetail: string
}) {
  if (
    isRequiredAddressIncomplete({
      address: state.address,
      addressDetail: state.addressDetail,
      subject: 'person',
    })
  ) {
    return false
  }

  if (state.schoolStatus === 'enrolled') {
    return Boolean(state.schoolName.trim() && state.grade.trim())
  }

  return true
}
