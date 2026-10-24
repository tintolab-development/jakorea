import { describe, expect, it } from 'vitest'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { UJAT_RECRUIT_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-recruit-form-institution-draft'
import { resolveRegistrationWizardIncompleteParagraphIds } from '@/features/program/shared/lib/registration-wizard-incomplete-map'

describe('resolveRegistrationWizardIncompleteParagraphIds', () => {
  it('maps curriculum unitContent[2] onto the education curriculum paragraph', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['curriculum.unitContent[2]'],
      'general'
    )
    expect([...ids]).toEqual([PROGRAM_REGISTRATION_IDS.educationCurriculum])
  })

  it('maps program phase keys to seed paragraph ids', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['kpi.instructor', 'basicInfo.programTitleKo'],
      'general'
    )
    expect(ids.has(PROGRAM_REGISTRATION_IDS.businessKpi)).toBe(true)
    expect(ids.has(PROGRAM_REGISTRATION_IDS.basicInfo)).toBe(true)
  })

  it('maps UJAT event range onto education schedule settings and capacity onto region capacity', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['h1.event.range', 'capacity.h1.서울'],
      'ujat'
    )
    expect(ids.has(UJAT_PROGRAM_REGISTRATION_IDS[3])).toBe(true)
    expect(ids.has(UJAT_PROGRAM_REGISTRATION_IDS[5])).toBe(true)
    expect(ids.has(UJAT_PROGRAM_REGISTRATION_IDS[6])).toBe(true)
  })

  it('maps UJAT recruitment keys onto recruit paragraphs', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['recruit.institution.announcementPublished', 'recruit.volunteer.h1.interviewSchedule'],
      'ujat'
    )
    expect(ids.has(UJAT_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo)).toBe(true)
    expect(ids.has('ujat-recruit-form-volunteer-seed-interview-schedule')).toBe(true)
  })

  it('maps third party application cell keys to paragraph id', () => {
    const ids = resolveRegistrationWizardIncompleteParagraphIds(
      ['application.thirdParty.program-application-institution-seed-third-party.0.2'],
      'general'
    )
    expect(ids.has('program-application-institution-seed-third-party')).toBe(true)
  })
})
