/**
 * 프로그램 신청 FormTemplate draft.
 *
 * 전제: CMS에 등록·연결된 APPLICATION 양식(templateCode + draft)을 Platform이 렌더한다.
 * 실 API 연동 전 — 동일 templateCode의 form-schema 시드 draft로 대체한다.
 *
 * TODO: 프로그램 applicationFormTemplateId · CMS 모집/신청 폼 draft API · useMutation 제출로 교체.
 */

import { createGeminiVisitingTrainingApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-institution-draft'
import { createGeminiVisitingTrainingApplicationFormInstructorDraft } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
import { createProgramApplicationFormEconomyDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import {
  createProgramParticipantApplicationDraft,
  PROGRAM_PARTICIPANT_APPLICATION_IDS,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { createProgramApplicationFormInstitutionDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import { createProgramApplicationFormInstructorDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { createProgramApplicationFormVolunteerDraft } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { ProgramDetail, ProgramListItem } from '../model/types.ts'
import {
  resolveProgramApplyFormCase,
  type ProgramApplyFormCase,
  type ProgramApplyFormCaseInput,
} from './apply-form-case.ts'

export type { ProgramApplyFormCase, ProgramApplyFormCaseInput }
export {
  getApplicationTemplateCodeForApplyCase,
  PROGRAM_APPLY_FORM_CASE_SSOT_IDS,
  resolveProgramApplyFormCase,
  shouldShowIndividualTeamInfoParagraph,
} from './apply-form-case.ts'

/** CMS `hiddenParagraphIds`와 동일 — 개인 일반에서 teamInfo 제거 */
function omitIndividualTeamInfoParagraph(draft: WritingFormDraft): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.filter(
      paragraph => paragraph.id !== PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo
    ),
  }
}

/** CMS templateCode에 대응하는 form-schema 시드 draft */
function createSeedDraftForApplyCase(applyCase: ProgramApplyFormCase): WritingFormDraft {
  switch (applyCase) {
    case 'individual-general': {
      const draft = createProgramParticipantApplicationDraft()
      return omitIndividualTeamInfoParagraph(draft)
    }
    case 'individual-team':
      return createProgramParticipantApplicationDraft()
    case 'individual-volunteer':
      return createProgramApplicationFormVolunteerDraft()
    case 'institution-general':
      return createProgramApplicationFormInstitutionDraft()
    case 'institution-economy':
      return createProgramApplicationFormEconomyDraft()
    case 'institution-gemini':
      return createGeminiVisitingTrainingApplicationFormInstitutionDraft()
    case 'instructor':
      return createProgramApplicationFormInstructorDraft()
    case 'instructor-gemini':
      return createGeminiVisitingTrainingApplicationFormInstructorDraft()
    default: {
      const _exhaustive: never = applyCase
      return _exhaustive
    }
  }
}

export function getMockApplyFormCase(
  program: ProgramApplyFormCaseInput
): ProgramApplyFormCase {
  return resolveProgramApplyFormCase(program)
}

/**
 * 프로그램 → 신청 폼 draft (mock).
 * 케이스 해석 후 CMS templateCode와 동일한 시드 draft를 반환한다.
 */
export function getMockApplyFormDraft(
  program: Pick<ProgramListItem | ProgramDetail, 'category' | 'id'> &
    Partial<Pick<ProgramDetail, 'detailCase' | 'participationMethod'>>
): WritingFormDraft {
  const applyCase = resolveProgramApplyFormCase(program)
  return createSeedDraftForApplyCase(applyCase)
}
