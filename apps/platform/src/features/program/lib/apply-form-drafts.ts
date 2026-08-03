/**
 * 프로그램 신청 FormTemplate mock draft.
 * 실 API 연동 전 — 프로그램 category 기준 시드 폼을 붙인다.
 * TODO: CMS 모집 폼 draft API · useMutation 제출로 교체.
 */

import { createProgramApplicationFormEconomyDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { createProgramParticipantApplicationDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { createProgramApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { createProgramApplicationFormInstructorDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { ProgramDetail, ProgramListItem } from '../model/types'

export function getMockApplyFormDraft(
  program: Pick<ProgramListItem | ProgramDetail, 'category' | 'id'>
): WritingFormDraft {
  switch (program.category) {
    case 'institution':
      // 1사1교 fixture id 접두 등으로 세분화 가능
      if (program.id.startsWith('economy-') || program.id.includes('economy')) {
        return createProgramApplicationFormEconomyDraft()
      }
      return createProgramApplicationFormInstitutionDraft()
    case 'instructor':
      return createProgramApplicationFormInstructorDraft()
    case 'youth':
    default:
      return createProgramParticipantApplicationDraft()
  }
}
