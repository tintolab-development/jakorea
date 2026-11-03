/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import { mapCompanySchoolToCreateRequest } from '@/features/program/1c-1s/api/adapters'
import { resolveRecruitmentPreviewProgram } from '@/features/program/general/lib/platform-preview-payload'
import { buildGeneralProgramPortalPreview } from '@/features/program/general/lib/platform-preview-payload'
import {
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { importLegacyOverlayToCompanySchoolCanonical } from './import-legacy-registration-overlay'
import {
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from './registration-rhf-api'
import {
  applyCompanySchoolRhfOverlayRecord,
  createDefaultCompanySchoolRegistrationRhfValues,
  rhfValuesFromCompanySchoolCanonical,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'

function mockRhfApi(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationRhfApi {
  let current = values
  return {
    getValues: () => current,
    getPath: () => undefined,
    setPath: () => undefined,
    reset: next => {
      current = next
    },
    applyOverlayRecord: overlay => {
      current = applyCompanySchoolRhfOverlayRecord(current, overlay)
    },
    isDirty: () => false,
    markBaseline: () => undefined,
  }
}

function filledWizardValues(): CompanySchoolRegistrationRhfValues {
  const values = createDefaultCompanySchoolRegistrationRhfValues()
  values.publicProgramTitle = '보존 공고'
  values.detailedProgramId = '163006'
  values.operationRange = { start: '2026-03-01', end: '2026-11-30' }
  values.sponsorId = 'sponsor-keep'
  values.managerContactIds = ['contact-keep']
  values.participantCount = 20
  values.instructor = 0
  values.dispatchedSchool = null
  values.grade1Fee = 100000
  values.paymentItemValues = ['p-keep']
  values.educationScheduleRange = { start: '2026-04-01', end: '2026-04-30' }
  values.curriculumSessions = [
    { sessionLabel: '1차시', title: '보존 1차시', description: '설명' },
    { sessionLabel: '2차시', title: '보존 2차시', description: '' },
  ]
  values.recruitment.maxClassCount = 4
  values.recruitment.inquiryContact = 'RHF 기관'
  values.recruitment.recruitRange = { start: '2026-03-01', end: '2026-03-31' }
  values.recruitment.announcementPublished = ''
  values.recruitment.notesNotApplicable = false
  values.recruitment.detailInfo.recruitmentGuide = '<p>모집 안내</p>'
  values.recruitment.detailInfo.thumbContentUrl = 'https://cdn.example/thumb.png'
  values.recruitment.detailInfo.attachmentFileNames = ['a.pdf']
  values.instructorRecruit.inquiryContact = 'RHF 강사'
  values.instructorRecruit.announcementPublished = 'published'
  values.instructorRecruit.recruitRange = { start: '2026-02-01', end: '2026-02-20' }
  values.application.basicInfo.applicationGrade = '초등'
  return values
}

describe('1사1교 기능 보존', () => {
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('CREATE request는 RHF 값만 쓰고 overlay leftover를 넣지 않는다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-economy', {
      'recruit.maxClassCount': 99,
      'recruit.inquiryContact': '스토어 기관',
    })
    const values = filledWizardValues()
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-preserve', values })
    const request = mapCompanySchoolToCreateRequest(program)
    expect(request.programType).toBe('COMPANY_SCHOOL')
    const overlay = JSON.parse(String(request.serviceDetailJson)).registration?.overlay as Record<
      string,
      unknown
    >
    expect(overlay['recruit.maxClassCount']).toBe(4)
    expect(overlay['recruit.inquiryContact']).toBe('RHF 기관')
    expect(overlay['economyRegistration.kpi.participantCount']).toBe(20)
    expect(overlay['economyRegistration.kpi.instructor']).toBe(0)
    expect(overlay['economyRegistration.kpi.dispatchedSchool']).toBeNull()
    expect(overlay['economyRegistration.wageInfo.grade1Fee']).toBe(100000)
    expect(JSON.stringify(request)).not.toContain('스토어 기관')
    expect(JSON.stringify(request)).not.toContain('application.economy')
  })

  it('위저드 미리보기는 overlay store leftover가 아니라 typed nested를 쓴다', () => {
    const values = filledWizardValues()
    const api = mockRhfApi(values)
    registerCompanySchoolRegistrationRhf(api)
    replaceGeneralRecruitOverlayForScope('recruitment-economy', {
      'recruit.maxClassCount': 99,
      'recruit.inquiryContact': '스토어 기관',
    })
    const before = structuredClone(api.getValues())
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-preview', values: api.getValues() })
    const previewed = resolveRecruitmentPreviewProgram(program, 'institutions')
    expect(previewed.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(4)
    expect(previewed.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      'RHF 기관'
    )
    const portal = buildGeneralProgramPortalPreview({
      program,
      audience: 'institutions',
      sponsorName: '후원사',
    })
    expect(portal.title).toBe('보존 공고')
    expect(portal.recruitmentGuide ?? portal.description).toBeTruthy()
    expect(api.getValues()).toEqual(before)
  })

  it('미리보기 후에도 신청·강사 RHF가 그대로다', () => {
    const values = filledWizardValues()
    const api = mockRhfApi(values)
    registerCompanySchoolRegistrationRhf(api)
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-preview-rhf', values })
    resolveRecruitmentPreviewProgram(program, 'instructors')
    expect(api.getValues().instructorRecruit.inquiryContact).toBe('RHF 강사')
    expect(api.getValues().application.basicInfo.applicationGrade).toBe('초등')
    expect(api.getValues().recruitment.maxClassCount).toBe(4)
  })

  it('레거시 overlay 초안은 instructor/recruit/sidecar를 살린다', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({
      overlay: {
        'economyRegistration.basicInfo.publicProgramTitle': '레거시 공고',
        'economyRegistration.kpi.volunteer': 3,
        'economyRegistration.kpi.educationProgress.done': 1,
        'recruit.maxClassCount': 0,
        'recruit.announcementPublished': '',
        'recruit.instructor.inquiryContact': '레거시 강사',
        'recruit.instructor.announcementPublished': 'unpublished',
      },
    })
    expect(imported.common.publicProgramTitle).toBe('레거시 공고')
    expect(imported.sidecar?.['economyRegistration.kpi.volunteer']).toBe(3)
    expect(imported.recruit?.maxClassCount).toBe(0)
    expect(imported.recruit?.announcementPublished).toBe('')
    expect(imported.instructorRecruit?.inquiryContact).toBe('레거시 강사')
    expect(imported.instructorRecruit?.announcementPublished).toBe('unpublished')
    const restored = rhfValuesFromCompanySchoolCanonical(
      imported.common,
      imported.sidecar,
      imported.recruit,
      imported.application,
      imported.instructorRecruit
    )
    expect(restored.publicProgramTitle).toBe('레거시 공고')
    expect(restored.recruitment.maxClassCount).toBe(0)
    expect(restored.instructorRecruit.inquiryContact).toBe('레거시 강사')
    expect(restored.sidecar['economyRegistration.kpi.volunteer']).toBe(3)
  })

  it('0/null/false/빈문자열을 서로 다른 의미로 유지한다', () => {
    const values = filledWizardValues()
    values.instructor = 0
    values.dispatchedSchool = null
    values.recruitment.maxAssignableInstructors = 0
    values.recruitment.notesNotApplicable = false
    values.recruitment.announcementPublished = ''
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-nil', values })
    expect(program.generalCommonInfo?.kpi?.instructorCount).toBe(0)
    expect(program.registrationOverlay?.['economyRegistration.kpi.dispatchedSchool']).toBeNull()
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(0)
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable).toBe(false)
    expect(program.registrationOverlay?.['recruit.announcementPublished']).toBe('')
  })
})
