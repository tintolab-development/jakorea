/**
 * 1사1교 기관 신청 typed state — persist editorState / Form Version helper.
 */
import {
  COMPANY_SCHOOL_APPLICATION_EDITOR_KIND,
  type CompanySchoolApplicationFormState,
} from './registration-canonical-types'
import { peekCompanySchoolRegistrationRhf } from './registration-rhf-api'
import {
  collectCompanySchoolApplicationState,
  emptyCompanySchoolApplicationFormState,
  importLegacyCompanySchoolApplicationOverlay,
  serializeCompanySchoolApplicationForFormVersion,
} from './registration-rhf-application'

export { emptyCompanySchoolApplicationFormState }

export function collectCompanySchoolApplicationFormState(
  overlay?: Record<string, unknown>
): CompanySchoolApplicationFormState {
  if (overlay != null) {
    return importLegacyCompanySchoolApplicationOverlay(overlay)
  }
  const rhf = peekCompanySchoolRegistrationRhf()
  if (rhf != null) {
    return collectCompanySchoolApplicationState(rhf.getValues().application)
  }
  return emptyCompanySchoolApplicationFormState()
}

export function companySchoolApplicationStateToApplyRecord(
  state: CompanySchoolApplicationFormState
): Record<string, unknown> {
  return serializeCompanySchoolApplicationForFormVersion(state)
}

export function companySchoolApplicationEditorState(
  state: CompanySchoolApplicationFormState
): Record<string, unknown> {
  return {
    kind: COMPANY_SCHOOL_APPLICATION_EDITOR_KIND,
    schemaVersion: 1,
    application: state,
  }
}

export function readCompanySchoolApplicationEditorState(
  editorState: Record<string, unknown> | undefined
): CompanySchoolApplicationFormState | null {
  if (editorState?.kind !== COMPANY_SCHOOL_APPLICATION_EDITOR_KIND) return null
  const application = editorState.application
  if (!application || typeof application !== 'object' || Array.isArray(application)) return null
  const rec = application as Partial<CompanySchoolApplicationFormState>
  const empty = emptyCompanySchoolApplicationFormState()
  return {
    ...empty,
    ...rec,
    basicInfo: { ...empty.basicInfo, ...(rec.basicInfo ?? {}) },
    guidanceAnswers: { ...empty.guidanceAnswers, ...(rec.guidanceAnswers ?? {}) },
    lessonReply: { ...empty.lessonReply, ...(rec.lessonReply ?? {}) },
    schedule: {
      first: { ...empty.schedule.first, ...(rec.schedule?.first ?? {}) },
      second: { ...empty.schedule.second, ...(rec.schedule?.second ?? {}) },
    },
  }
}
