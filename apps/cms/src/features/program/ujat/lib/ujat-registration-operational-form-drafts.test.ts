/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import {
  clearUjatRegistrationOperationalFormDrafts,
  listUjatRegistrationOperationalFormTemplateIds,
} from './ujat-registration-operational-form-drafts'

describe('clearUjatRegistrationOperationalFormDrafts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes UJAT recruitment/application drafts only', () => {
    persistWritingFormTemplateSave({
      templateId: 'registration-ujat',
      draft: createApplicantRecruitFormInstitutionDraft(),
      editorState: { programTitleKo: 'UJAT' },
    })
    persistWritingFormTemplateSave({
      templateId: 'recruitment-ujat-school',
      draft: createApplicantRecruitFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'application-ujat-volunteer',
      draft: createApplicantRecruitFormInstitutionDraft(),
    })
    persistWritingFormTemplateSave({
      templateId: 'recruitment-participant-school',
      draft: createApplicantRecruitFormInstitutionDraft(),
    })

    clearUjatRegistrationOperationalFormDrafts()

    expect(loadWritingFormTemplateSave('registration-ujat')).not.toBeNull()
    expect(loadWritingFormTemplateSave('recruitment-ujat-school')).toBeNull()
    expect(loadWritingFormTemplateSave('application-ujat-volunteer')).toBeNull()
    expect(loadWritingFormTemplateSave('recruitment-participant-school')).not.toBeNull()
  })

  it('lists unique UJAT operational template ids', () => {
    const ids = listUjatRegistrationOperationalFormTemplateIds()
    expect(ids).toContain('recruitment-ujat-school')
    expect(ids).toContain('recruitment-ujat-volunteer')
    expect(ids).toContain('application-ujat-school')
    expect(ids).toContain('application-ujat-volunteer')
    expect(ids).not.toContain('registration-ujat')
    expect(ids.filter(id => id === 'recruitment-ujat-volunteer')).toHaveLength(1)
  })
})
