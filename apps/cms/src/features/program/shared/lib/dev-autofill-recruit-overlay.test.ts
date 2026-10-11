/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { collectSelectedRecruitOverlaysForProgram } from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  applyDevAutofillRecruitOverlayPartials,
  listDevAutofillRecruitOverlayTargets,
} from '@/features/program/shared/lib/dev-autofill-recruit-overlay'
import {
  clearRegistrationStepTemplateSelections,
  setRegistrationStepTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'
import {
  getGeneralRecruitOverlayRecord,
  getGeneralRecruitOverlayScope,
  peekGeneralRecruitOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { peekApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { peekUjatRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import { peekUjatRecruitVolunteerOverlayRecord } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import {
  resetAllOperationalOverlayStoresForTests,
  setOperationalOverlayScope,
} from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'

const individualOnly = {
  individual: true,
  organization: false,
  teacherInstructor: false,
  volunteer: false,
} as const

const organizationOnly = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
} as const

describe('dev autofill recruit overlay buckets', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStoresForTests()
    clearRegistrationStepTemplateSelections()
  })

  it('lists visible general recruit codes and honors copy selection', () => {
    expect(listDevAutofillRecruitOverlayTargets('general', individualOnly)).toEqual({
      generalRecruit: ['recruitment-participant-individual'],
      institutionRecruit: [],
      ujatInstitution: [],
      ujatVolunteer: [],
    })
    setRegistrationStepTemplateSelection(
      'GENERAL',
      'recruit-participant-individual',
      'recruitment-participant-individual-copy-12'
    )
    expect(listDevAutofillRecruitOverlayTargets('general', individualOnly).generalRecruit).toEqual([
      'recruitment-participant-individual-copy-12',
    ])
  })

  it('lists 1사1교 institution code and hides volunteer', () => {
    const targets = listDevAutofillRecruitOverlayTargets('economy', {
      ...organizationOnly,
      volunteer: true,
    })
    expect(targets.institutionRecruit).toEqual(['recruitment-economy'])
    expect(targets.generalRecruit).toEqual([])
  })

  it('lists 교육받은 교사 institution code', () => {
    expect(
      listDevAutofillRecruitOverlayTargets('trainedTeachers', organizationOnly).institutionRecruit
    ).toEqual(['recruitment-trained-teachers'])
  })

  it('lists UJAT school and volunteer codes once', () => {
    const targets = listDevAutofillRecruitOverlayTargets('ujat')
    expect(targets.ujatInstitution).toEqual(['recruitment-ujat-school'])
    expect(targets.ujatVolunteer).toEqual(['recruitment-ujat-volunteer'])
  })

  it('keeps application scope and peeks individual recruit after general autofill', () => {
    setOperationalOverlayScope('application-participant-individual')
    const scopeBefore = getGeneralRecruitOverlayScope()

    applyDevAutofillRecruitOverlayPartials('general', individualOnly, {
      general: {
        'recruit.individual.inquiryContact': '박지훈',
        'recruit.detailInfo.programDescription': '모집 설명',
      },
    })

    expect(getGeneralRecruitOverlayScope()).toBe(scopeBefore)
    expect(getGeneralRecruitOverlayRecord()['recruit.individual.inquiryContact']).toBeUndefined()
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-participant-individual')[
        'recruit.individual.inquiryContact'
      ]
    ).toBe('박지훈')
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-participant-individual')[
        'recruit.detailInfo.programDescription'
      ]
    ).toBe('모집 설명')

    const overlay = collectSelectedRecruitOverlaysForProgram({
      id: '100001',
      generalParticipantTypes: ['individual'],
    } as Program)
    expect(overlay['recruit.individual.inquiryContact']).toBe('박지훈')
    expect(overlay['recruit.detailInfo.programDescription']).toBe('모집 설명')
  })

  it('peeks 1사1교 economy bucket while application scope is active', () => {
    setOperationalOverlayScope('application-economy')
    const scopeBefore = getGeneralRecruitOverlayScope()

    applyDevAutofillRecruitOverlayPartials('economy', organizationOnly, {
      institution: {
        'recruit.inquiryContact': '기관문의',
        'recruit.notes': '테스토 비고',
      },
      general: {
        'economyRecruit.detailInfo.programDescription': '1사1교 상세',
      },
    })

    expect(getGeneralRecruitOverlayScope()).toBe(scopeBefore)
    expect(getGeneralRecruitOverlayRecord()['economyRecruit.detailInfo.programDescription']).toBeUndefined()
    expect(peekApplicantRecruitInstitutionOverlayRecord('recruitment-economy')['recruit.notes']).toBe(
      '테스토 비고'
    )
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-economy')[
        'economyRecruit.detailInfo.programDescription'
      ]
    ).toBe('1사1교 상세')

    const overlay = collectSelectedRecruitOverlaysForProgram({
      id: '170001',
      generalParticipantTypes: ['school_institution'],
    } as Program)
    expect(overlay['recruit.notes']).toBe('테스토 비고')
    expect(overlay['economyRecruit.detailInfo.programDescription']).toBe('1사1교 상세')
  })

  it('peeks UJAT school and volunteer buckets without changing scope', () => {
    setOperationalOverlayScope('application-ujat-volunteer')
    const scopeBefore = getGeneralRecruitOverlayScope()

    applyDevAutofillRecruitOverlayPartials('ujat', undefined, {
      ujatInstitution: { 'ujat.recruit.institution.notes': '학교 모집 비고' },
      ujatVolunteer: { 'ujat.recruit.volunteer.publicTitle': '봉사자 모집' },
      general: {
        'recruitVolunteer.detailInfo.programDescription': '봉사 모집 설명',
      },
    })

    expect(getGeneralRecruitOverlayScope()).toBe(scopeBefore)
    expect(getGeneralRecruitOverlayRecord()['recruitVolunteer.detailInfo.programDescription']).toBeUndefined()
    expect(
      peekUjatRecruitInstitutionOverlayRecord('recruitment-ujat-school')[
        'ujat.recruit.institution.notes'
      ]
    ).toBe('학교 모집 비고')
    expect(
      peekUjatRecruitVolunteerOverlayRecord('recruitment-ujat-volunteer')[
        'ujat.recruit.volunteer.publicTitle'
      ]
    ).toBe('봉사자 모집')
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-ujat-volunteer')[
        'recruitVolunteer.detailInfo.programDescription'
      ]
    ).toBe('봉사 모집 설명')

    const overlay = collectSelectedRecruitOverlaysForProgram({
      id: 'ujat-registration-snapshot',
      ujatProgressStatus: 'EDUCATION_SCHEDULED',
    } as Program)
    expect(overlay['ujat.recruit.institution.notes']).toBe('학교 모집 비고')
    expect(overlay['ujat.recruit.volunteer.publicTitle']).toBe('봉사자 모집')
    expect(overlay['recruitVolunteer.detailInfo.programDescription']).toBe('봉사 모집 설명')
  })
})
