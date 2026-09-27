import { beforeEach, describe, expect, it } from 'vitest'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { createProgramApplicationFormVolunteerDraft } from '@/features/template/model/program-application-form-volunteer-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import {
  clearRegistrationWizardSessionDrafts,
  flushApplicationOperationalOverrides,
  rememberRegistrationWizardSessionDraft,
} from './registration-wizard-session-drafts'

describe('registration wizard session drafts', () => {
  beforeEach(() => {
    clearRegistrationWizardSessionDrafts()
  })

  it('keeps every visited application draft and ignores recruitment templates', () => {
    const institution = createProgramApplicationFormInstitutionDraft()
    const volunteer = createProgramApplicationFormVolunteerDraft()
    institution.paragraphs[0] = {
      ...institution.paragraphs[0],
      paragraphTitle: '기관 신청 수정',
    }
    volunteer.paragraphs[0] = {
      ...volunteer.paragraphs[0],
      paragraphTitle: '봉사자 신청 수정',
    }

    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-participant-school',
      draft: institution,
    })
    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-volunteer',
      draft: volunteer,
      editorState: { volunteerExceptionScheduleCount: 2 },
    })
    rememberRegistrationWizardSessionDraft({
      templateCode: 'recruitment-instructor',
      draft: createRecruitFormInstructorDraft(),
    })

    const overrides = flushApplicationOperationalOverrides({
      overlayForTemplateCode: code =>
        code === 'application-volunteer' ? { 'application.volunteer.interview': [] } : {},
    })

    expect(overrides.map(item => item.templateCode)).toEqual([
      'application-participant-school',
      'application-volunteer',
    ])
    expect(overrides[0]?.draft.paragraphs[0]?.paragraphTitle).toBe('기관 신청 수정')
    expect(overrides[0]?.overlay).toBeUndefined()
    expect(overrides[1]?.draft.paragraphs[0]?.paragraphTitle).toBe('봉사자 신청 수정')
    expect(overrides[1]?.overlay).toEqual({ 'application.volunteer.interview': [] })
    expect(overrides[1]?.editorState).toEqual({ volunteerExceptionScheduleCount: 2 })
  })

  it('replaces the active application tab with the draft passed at complete time', () => {
    const earlier = createProgramApplicationFormVolunteerDraft()
    earlier.paragraphs[0] = { ...earlier.paragraphs[0], paragraphTitle: '이전' }
    const latest = createProgramApplicationFormVolunteerDraft()
    latest.paragraphs[0] = { ...latest.paragraphs[0], paragraphTitle: '현재 탭' }

    rememberRegistrationWizardSessionDraft({
      templateCode: 'application-volunteer',
      draft: earlier,
    })

    const overrides = flushApplicationOperationalOverrides({
      current: {
        templateCode: 'application-volunteer',
        draft: latest,
      },
    })

    expect(overrides).toHaveLength(1)
    expect(overrides[0]?.draft.paragraphs[0]?.paragraphTitle).toBe('현재 탭')
  })
})
