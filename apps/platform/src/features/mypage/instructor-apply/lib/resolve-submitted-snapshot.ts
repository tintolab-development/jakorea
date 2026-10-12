import { loadInstructorApplyFormDraft } from '../consent/form-persist'
import type { InstructorApplySubmittedSnapshot } from '../api/map-detail-to-form-values'
import { mapInstructorRoleRequestDetailToSubmittedSnapshot } from '../api/map-detail-to-form-values'
import type { InstructorRoleRequestDetail } from '../api/types'
import {
  applyLockedBasicToInstructorForm,
  type InstructorApplyLockedBasicInfo,
} from '../map-locked-basic-info'

/** 상세 API 미배포·실패 시 session draft + locked basic (로컬 검증용) */
export function resolveSubmittedSnapshotFromDraft(
  lockedBasic: InstructorApplyLockedBasicInfo,
  requestedAt?: string,
): InstructorApplySubmittedSnapshot | null {
  const draft = loadInstructorApplyFormDraft()
  if (!draft) return null

  const values = applyLockedBasicToInstructorForm(draft, lockedBasic, false)
  return {
    values,
    requestedAt,
    consentAgreedAt: {},
  }
}

export function resolveInstructorApplySubmittedSnapshot(input: {
  detail: InstructorRoleRequestDetail | null | undefined
  lockedBasic: InstructorApplyLockedBasicInfo
  requestedAtFallback?: string
}): InstructorApplySubmittedSnapshot | null {
  if (input.detail?.profile || input.detail?.name) {
    return mapInstructorRoleRequestDetailToSubmittedSnapshot(input.detail)
  }

  return resolveSubmittedSnapshotFromDraft(input.lockedBasic, input.requestedAtFallback)
}
