/**
 * 프로그램 신청 FormTemplate mock draft.
 * 실 API 연동 전 — 프로그램 category·detailCase 기준 시드 폼을 붙인다.
 * TODO: CMS 모집 폼 draft API · useMutation 제출로 교체.
 */

import { createProgramApplicationFormEconomyDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { createProgramParticipantApplicationDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { createProgramApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { createProgramApplicationFormInstructorDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { createProgramApplicationFormVolunteerDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { ProgramDetail, ProgramListItem } from '../model/types'
import { PROGRAM_DETAIL_CASE_SSOT_IDS } from './detail-case'

export function getMockApplyFormDraft(
  program: Pick<ProgramListItem | ProgramDetail, 'category' | 'id'> &
    Partial<Pick<ProgramDetail, 'detailCase'>>
): WritingFormDraft {
  const detailCase = program.detailCase
  if (
    detailCase === 'volunteer' ||
    detailCase === 'ujat-volunteer' ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.volunteer ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.ujatVolunteer
  ) {
    return createProgramApplicationFormVolunteerDraft()
  }

  if (
    detailCase === 'instructor' ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.instructor
  ) {
    return createProgramApplicationFormInstructorDraft()
  }

  if (
    detailCase === 'ujat-participant' ||
    program.id === PROGRAM_DETAIL_CASE_SSOT_IDS.ujatParticipant
  ) {
    return createProgramApplicationFormInstitutionDraft()
  }

  switch (program.category) {
    case 'institution':
      if (program.id.startsWith('economy-') || program.id.includes('economy')) {
        return createProgramApplicationFormEconomyDraft()
      }
      if (program.id.startsWith('gvt-recruitment-') || detailCase === 'gemini') {
        return createProgramApplicationFormInstitutionDraft()
      }
      return createProgramApplicationFormInstitutionDraft()
    case 'instructor':
      return createProgramApplicationFormInstructorDraft()
    case 'youth':
    default:
      return createProgramParticipantApplicationDraft()
  }
}
