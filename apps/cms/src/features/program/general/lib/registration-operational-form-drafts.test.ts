/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import {
  clearRegistrationOperationalFormDrafts,
  listRegistrationOperationalFormDraftStorageKeys,
  resolveRegistrationOperationalDraftStorageKey,
} from './registration-operational-form-drafts'

describe('clearRegistrationOperationalFormDrafts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('general clear removes only general recruitment/application drafts', () => {
    persistWritingFormTemplateSave({
      templateId: 'registration-general',
      draft: createApplicantRecruitFormInstitutionDraft(),
      editorState: { programTitleKo: '공통' },
    })
    persistWritingFormTemplateSave({
      templateId: 'recruitment-participant-school',
      draft: createApplicantRecruitFormInstitutionDraft(),
      editorState: { note: '모집' },
    })
    persistWritingFormTemplateSave({
      templateId: 'application-participant-school',
      draft: createProgramApplicationFormInstitutionDraft(),
      editorState: { note: '신청' },
    })
    persistWritingFormTemplateSave({
      templateId: 'application-economy',
      draft: createProgramApplicationFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'application-trained-teachers',
      draft: createProgramApplicationFormInstitutionDraft(),
    })

    clearRegistrationOperationalFormDrafts('general')

    expect(loadWritingFormTemplateSave('registration-general')).not.toBeNull()
    expect(loadWritingFormTemplateSave('recruitment-participant-school')).toBeNull()
    expect(loadWritingFormTemplateSave('application-participant-school')).toBeNull()
    expect(loadWritingFormTemplateSave('application-economy')).not.toBeNull()
    expect(loadWritingFormTemplateSave('application-trained-teachers')).not.toBeNull()
  })

  it('economy clear does not remove general or trained-teachers drafts', () => {
    persistWritingFormTemplateSave({
      templateId: 'recruitment-participant-school',
      draft: createApplicantRecruitFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'application-economy',
      draft: createProgramApplicationFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'recruitment-economy',
      draft: createApplicantRecruitFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'application-trained-teachers',
      draft: createProgramApplicationFormInstitutionDraft(),
    })
    const economyInstructorKey = resolveRegistrationOperationalDraftStorageKey(
      'economy',
      'recruitment-instructor'
    )
    persistWritingFormTemplateSave({
      templateId: economyInstructorKey,
      draft: createApplicantRecruitFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'recruitment-instructor',
      draft: createApplicantRecruitFormInstitutionDraft(),
    })

    clearRegistrationOperationalFormDrafts('economy')

    expect(loadWritingFormTemplateSave('recruitment-participant-school')).not.toBeNull()
    expect(loadWritingFormTemplateSave('application-trained-teachers')).not.toBeNull()
    expect(loadWritingFormTemplateSave('application-economy')).toBeNull()
    expect(loadWritingFormTemplateSave('recruitment-economy')).toBeNull()
    expect(loadWritingFormTemplateSave(economyInstructorKey)).toBeNull()
    expect(loadWritingFormTemplateSave('recruitment-instructor')).not.toBeNull()
  })

  it('trainedTeachers clear removes only its application draft', () => {
    persistWritingFormTemplateSave({
      templateId: 'application-trained-teachers',
      draft: createProgramApplicationFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'application-economy',
      draft: createProgramApplicationFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'application-participant-school',
      draft: createProgramApplicationFormInstitutionDraft(),
    })

    clearRegistrationOperationalFormDrafts('trainedTeachers')

    expect(loadWritingFormTemplateSave('application-trained-teachers')).toBeNull()
    expect(loadWritingFormTemplateSave('application-economy')).not.toBeNull()
    expect(loadWritingFormTemplateSave('application-participant-school')).not.toBeNull()
  })

  it('lists storage keys per variant without cross-type owned ids', () => {
    const general = listRegistrationOperationalFormDraftStorageKeys('general')
    expect(general).toContain('recruitment-instructor')
    expect(general).toContain('application-volunteer')
    expect(general).not.toContain('recruitment-economy')
    expect(general).not.toContain('application-trained-teachers')
    expect(general).not.toContain('registration-general')

    const economy = listRegistrationOperationalFormDraftStorageKeys('economy')
    expect(economy).toContain('recruitment-economy')
    expect(economy).toContain('application-economy')
    expect(economy).toContain('reg-draft:economy:recruitment-instructor')
    expect(economy).not.toContain('recruitment-participant-school')

    const trained = listRegistrationOperationalFormDraftStorageKeys('trainedTeachers')
    expect(trained).toEqual(['application-trained-teachers'])
  })
})
