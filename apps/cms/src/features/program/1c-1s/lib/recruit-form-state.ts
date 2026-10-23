/**
 * 1사1교 기관 모집 typed state — persist overlay 출력 / Program apply helper.
 */
import type { Program } from '@/types/domain'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { COMPANY_SCHOOL_RECRUIT_EDITOR_KIND, type CompanySchoolRecruitFormState } from './registration-canonical-types'
import { peekCompanySchoolRegistrationRhf } from './registration-rhf-api'
import {
  collectCompanySchoolRecruitmentState,
  emptyCompanySchoolRecruitFormState,
  importLegacyCompanySchoolRecruitmentOverlay,
  serializeCompanySchoolRecruitmentForFormVersion,
} from './registration-rhf-recruitment'

export { emptyCompanySchoolRecruitFormState }

export function collectCompanySchoolRecruitFormState(
  overlay?: Record<string, unknown>
): CompanySchoolRecruitFormState {
  if (overlay != null) {
    return importLegacyCompanySchoolRecruitmentOverlay(overlay)
  }
  const rhf = peekCompanySchoolRegistrationRhf()
  if (rhf != null) {
    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
    return collectCompanySchoolRecruitmentState(rhf.getValues().recruitment)
  }
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  return emptyCompanySchoolRecruitFormState()
}

export function companySchoolRecruitStateToApplyRecord(
  state: CompanySchoolRecruitFormState
): Record<string, unknown> {
  return serializeCompanySchoolRecruitmentForFormVersion(state)
}

export function applyCompanySchoolRecruitToProgram(
  program: Program,
  state: CompanySchoolRecruitFormState
): Program {
  return applyGeneralRecruitOverlayToProgram(
    program,
    companySchoolRecruitStateToApplyRecord(state),
    { preferOverlay: true }
  )
}

export function companySchoolRecruitEditorState(
  state: CompanySchoolRecruitFormState
): Record<string, unknown> {
  return {
    kind: COMPANY_SCHOOL_RECRUIT_EDITOR_KIND,
    schemaVersion: 1,
    recruit: state,
  }
}

export function readCompanySchoolRecruitEditorState(
  editorState: Record<string, unknown> | undefined
): CompanySchoolRecruitFormState | null {
  if (editorState?.kind !== COMPANY_SCHOOL_RECRUIT_EDITOR_KIND) return null
  const recruit = editorState.recruit
  if (!recruit || typeof recruit !== 'object' || Array.isArray(recruit)) return null
  return { ...emptyCompanySchoolRecruitFormState(), ...(recruit as CompanySchoolRecruitFormState) }
}
