/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as K } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  patchApplicantRecruitInstitutionOverlay,
  peekApplicantRecruitInstitutionOverlayRecord,
  resetApplicantRecruitInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { listIncompleteEconomyProgramRecruitmentRequiredFields } from '@/features/program/general/lib/economy-program-registration-required-fields'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { importLegacyOverlayToCompanySchoolCanonical } from './import-legacy-registration-overlay'
import {
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from './registration-rhf-api'
import {
  applyCompanySchoolRhfOverlayRecord,
  createDefaultCompanySchoolRegistrationRhfValues,
  omitCompanySchoolCommonInfoOverlayKeys,
  rhfValuesFromCompanySchoolCanonical,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'
import type { CompanySchoolRecruitFormState } from './registration-canonical-types'
import {
  emptyCompanySchoolRecruitFormState,
  importLegacyCompanySchoolRecruitmentOverlay,
  omitCompanySchoolRecruitmentOverlayKeys,
  serializeCompanySchoolRecruitmentForFormVersion,
} from './registration-rhf-recruitment'
import { serializeCompanySchoolRegistrationForFormVersion } from './serialize-registration-overlay-from-canonical'
import {
  companySchoolRecruitEditorState,
  readCompanySchoolRecruitEditorState,
} from './recruit-form-state'

function filledRecruit(
  patch: Partial<CompanySchoolRecruitFormState> = {}
): CompanySchoolRecruitFormState {
  return {
    ...emptyCompanySchoolRecruitFormState(),
    programRange: { start: '2026-04-01', end: '2026-12-31' },
    recruitRange: { start: '2026-03-01', end: '2026-03-31' },
    finalAnnounce: '2026-04-02',
    finalAnnounceMethod: '홈페이지',
    maxAssignableInstructors: 5,
    maxClassCount: 20,
    targetLevels: ['ELEMENTARY'],
    targetLevelDetail: '초등 전학년',
    inquiryContact: '담당RHF',
    inquiryTel: '02-0000-0000',
    inquiryEmail: 'cs@example.com',
    announcementPublished: 'published',
    preguidanceRequired: 'need',
    studentListRequired: 'need',
    notes: 'RHF 비고',
    notesNotApplicable: false,
    detailInfo: {
      programDescription: '<p>소개</p>',
      recruitmentGuide: '<p>안내</p>',
      applicationMethod: '<p>방법</p>',
      learningSupportContent: '<p>지원</p>',
      additionalContentHtml: '<p>RHF 상세</p>',
      thumbFileObjectId: 77,
      attachmentFileObjectIds: [11, 22],
      thumbFileName: 'thumb.png',
      thumbContentUrl: 'https://cdn.example/thumb.png',
      attachmentFileNames: ['a.pdf', 'b.pdf'],
    },
    ...patch,
  }
}

function filledRhf(
  patch: Partial<CompanySchoolRegistrationRhfValues> = {}
): CompanySchoolRegistrationRhfValues {
  return {
    ...createDefaultCompanySchoolRegistrationRhfValues(),
    publicProgramTitle: 'RHF 공고명',
    detailedProgramId: '163006',
    detailedProgramName: 'RHF 세부',
    operationRange: { start: '2026-01-10', end: '2026-11-30' },
    sponsorId: 'sponsor-rhf',
    managerContactIds: ['contact-rhf'],
    educationCourse: 'ja',
    participantCount: 20,
    instructor: 4,
    dispatchedSchool: 3,
    dispatchedClass: 6,
    educationScheduleRange: { start: '2026-04-01', end: '2026-04-30' },
    recruitment: filledRecruit(),
    ...patch,
  }
}

function mockRhfApi(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationRhfApi {
  let current = values
  return {
    getValues: () => current,
    getPath: path => (path === 'recruitment' ? current.recruitment : undefined),
    setPath: (path, value) => {
      if (path === 'recruitment') {
        current = { ...current, recruitment: value as CompanySchoolRegistrationRhfValues['recruitment'] }
      }
    },
    reset: next => {
      current = next
    },
    applyOverlayRecord: overlay => {
      current = applyCompanySchoolRhfOverlayRecord(current, overlay)
    },
    isDirty: () => true,
    markBaseline: () => undefined,
  }
}

describe('1사1교 등록 기관 모집 RHF SSOT', () => {
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetApplicantRecruitInstitutionOverlayStoreForTests()
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('RHF와 Overlay가 달라도 CREATE·PUT·검증은 RHF를 쓴다', () => {
    const values = filledRhf()
    const stale = {
      [K.maxClassCount]: 40,
      [K.recruitRangeSeal]: { start: '2020-01-01', end: '2020-01-31' },
      'economyRecruit.detailInfo.additionalContentHtml': '<p>old</p>',
      'recruit.detailInfo.additionalContentHtml': '<p>old-recruit</p>',
      'economyRecruit.detailInfo.thumbFileObjectId': 1,
    }
    patchApplicantRecruitInstitutionOverlay(stale)
    patchGeneralRecruitOverlay(stale)
    registerCompanySchoolRegistrationRhf(mockRhfApi(values))

    const peeked = peekApplicantRecruitInstitutionOverlayRecord('recruitment-economy')
    expect(peeked[K.maxClassCount]).toBe(20)
    expect(peeked[K.recruitRangeSeal]).toEqual({ start: '2026-03-01', end: '2026-03-31' })
    expect(peeked['economyRecruit.detailInfo.additionalContentHtml']).toBe('<p>RHF 상세</p>')
    expect(peeked['economyRecruit.detailInfo.thumbFileObjectId']).toBe(77)

    const reasons = listIncompleteEconomyProgramRecruitmentRequiredFields({
      organization: true,
      teacherInstructor: false,
      individual: false,
      volunteer: false,
    })
    expect(reasons).toEqual([])

    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-recruit', values })
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(20)
    expect(program.generalCommonInfo?.announcementTitle).toBe('RHF 공고명')
    expect(program.registrationOverlay?.['economyRegistration.basicInfo.operationRangeSeal']).toEqual({
      start: '2026-01-10',
      end: '2026-11-30',
    })

    const overlay = serializeCompanySchoolRecruitmentForFormVersion(values.recruitment)
    expect(overlay[K.maxClassCount]).toBe(20)
    expect(overlay[K.recruitRangeSeal]).toEqual({ start: '2026-03-01', end: '2026-03-31' })
    expect(overlay['economyRecruit.detailInfo.additionalContentHtml']).toBe('<p>RHF 상세</p>')
    expect(overlay['recruit.detailInfo.additionalContentHtml']).toBe('<p>RHF 상세</p>')
    expect(overlay['economyRecruit.detailInfo.thumbFileObjectId']).toBe(77)
    expect(JSON.stringify(overlay)).not.toContain('application.economy')
  })

  it('명시적 빈 값은 stale Overlay를 복원하지 않는다', () => {
    const values = filledRhf({
      recruitment: {
        ...filledRecruit(),
        notes: '',
        targetLevels: [],
        notesNotApplicable: false,
        announcementPublished: '',
        detailInfo: {
          ...filledRecruit().detailInfo,
          additionalContentHtml: '',
          attachmentFileObjectIds: [],
          thumbFileObjectId: null,
        },
      },
    })
    const overlay = serializeCompanySchoolRecruitmentForFormVersion(values.recruitment)
    expect(overlay[K.notes]).toBe('')
    expect(overlay[K.targetLevels]).toEqual([])
    expect(overlay[K.notesNotApplicable]).toBe(false)
    expect(overlay[K.announcementPublished]).toBe('')
    expect(overlay['economyRecruit.detailInfo.additionalContentHtml']).toBe('')
    expect(overlay['economyRecruit.detailInfo.attachmentFileObjectIds']).toEqual([])
    expect(overlay['economyRecruit.detailInfo.thumbFileObjectId']).toBeNull()
  })

  it('공통정보 operationRange와 모집 programRange/recruitRange는 독립이다', () => {
    const values = filledRhf({
      operationRange: { start: '2026-01-10', end: '2026-11-30' },
      recruitment: filledRecruit({
        programRange: { start: '2026-04-01', end: '2026-12-31' },
        recruitRange: { start: '2026-03-01', end: '2026-03-31' },
      }),
    })
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-range', values })
    expect(program.registrationOverlay?.['economyRegistration.basicInfo.operationRangeSeal']).toEqual({
      start: '2026-01-10',
      end: '2026-11-30',
    })
    expect(String(program.applicationStartDate ?? '')).toContain('2026-03-01')
    expect(String(program.applicationEndDate ?? '')).toContain('2026-03-31')
    const overlay = serializeCompanySchoolRecruitmentForFormVersion(values.recruitment)
    expect(overlay[K.programRangeSeal]).toEqual({ start: '2026-04-01', end: '2026-12-31' })
    expect(overlay[K.recruitRangeSeal]).toEqual({ start: '2026-03-01', end: '2026-03-31' })
    const commonOverlay = serializeCompanySchoolRegistrationForFormVersion(values)
    expect(commonOverlay['economyRegistration.basicInfo.operationRangeSeal']).toEqual({
      start: '2026-01-10',
      end: '2026-11-30',
    })
  })

  it('blob URL을 Form Version에 넣지 않고 fileObjectId는 유지한다', () => {
    const overlay = serializeCompanySchoolRecruitmentForFormVersion(
      filledRecruit({
        detailInfo: {
          ...filledRecruit().detailInfo,
          thumbContentUrl: 'blob:https://cms.local/preview',
          thumbFileObjectId: 42,
          attachmentFileObjectIds: [3, 4, 5],
        },
      })
    )
    expect(JSON.stringify(overlay)).not.toContain('blob:')
    expect(overlay['economyRecruit.detailInfo.thumbContentUrl']).toBe('')
    expect(overlay['economyRecruit.detailInfo.thumbFileObjectId']).toBe(42)
    expect(overlay['economyRecruit.detailInfo.attachmentFileObjectIds']).toEqual([3, 4, 5])
  })

  it('recruit.detailInfo가 economyRecruit.detailInfo보다 우선한다', () => {
    const imported = importLegacyCompanySchoolRecruitmentOverlay({
      'economyRecruit.detailInfo.additionalContentHtml': '<p>economy</p>',
      'recruit.detailInfo.additionalContentHtml': '<p>recruit</p>',
      'economyRecruit.detailInfo.thumbFileObjectId': 1,
      'recruit.detailInfo.thumbFileObjectId': 9,
    })
    expect(imported.detailInfo.additionalContentHtml).toBe('<p>recruit</p>')
    expect(imported.detailInfo.thumbFileObjectId).toBe(9)
  })

  it('모집 수정은 P1 공통정보를 바꾸지 않는다', () => {
    const values = filledRhf({ publicProgramTitle: '공통 유지', participantCount: 20 })
    const next = applyCompanySchoolRhfOverlayRecord(values, {
      [K.maxClassCount]: 8,
      'economyRecruit.detailInfo.additionalContentHtml': '<p>모집만</p>',
    })
    expect(next.publicProgramTitle).toBe('공통 유지')
    expect(next.participantCount).toBe(20)
    expect(next.recruitment.maxClassCount).toBe(8)
    expect(next.recruitment.detailInfo.additionalContentHtml).toBe('<p>모집만</p>')
  })

  it('강사 leftover 키는 기관 RHF serialize에 섞이지 않는다', () => {
    const leftover = {
      'recruit.instructor.notes': '강사 leftover',
      [K.maxClassCount]: 99,
    }
    const merged = {
      ...leftover,
      ...serializeCompanySchoolRecruitmentForFormVersion(filledRecruit()),
    }
    expect(merged[K.maxClassCount]).toBe(20)
    expect(merged['recruit.instructor.notes']).toBe('강사 leftover')
  })

  it('상세 정보는 필수가 아니다', () => {
    const values = filledRhf({
      recruitment: filledRecruit({
        detailInfo: emptyCompanySchoolRecruitFormState().detailInfo,
      }),
    })
    registerCompanySchoolRegistrationRhf(mockRhfApi(values))
    const reasons = listIncompleteEconomyProgramRecruitmentRequiredFields({
      organization: true,
      teacherInstructor: false,
      individual: false,
      volunteer: false,
    })
    expect(reasons.some(key => key.includes('detailInfo'))).toBe(false)
    expect(reasons.some(key => key.includes('additionalContent'))).toBe(false)
  })

  it('제한값 0은 유효하고 null은 미입력으로 본다', () => {
    const withZero = filledRhf({
      recruitment: filledRecruit({ maxClassCount: 0, maxAssignableInstructors: 0 }),
    })
    registerCompanySchoolRegistrationRhf(mockRhfApi(withZero))
    expect(
      listIncompleteEconomyProgramRecruitmentRequiredFields({
        organization: true,
        teacherInstructor: false,
        individual: false,
        volunteer: false,
      })
    ).toEqual([])

    const withNull = filledRhf({
      recruitment: filledRecruit({ maxClassCount: null, maxAssignableInstructors: null }),
    })
    registerCompanySchoolRegistrationRhf(mockRhfApi(withNull))
    expect(
      listIncompleteEconomyProgramRecruitmentRequiredFields({
        organization: true,
        teacherInstructor: false,
        individual: false,
        volunteer: false,
      })
    ).toEqual([])
  })

  it('공고 게시 여부 빈 값과 비고 미입력은 필수 오류다', () => {
    const values = filledRhf({
      recruitment: filledRecruit({
        announcementPublished: '',
        notes: '',
        notesNotApplicable: false,
      }),
    })
    registerCompanySchoolRegistrationRhf(mockRhfApi(values))
    const reasons = listIncompleteEconomyProgramRecruitmentRequiredFields({
      organization: true,
      teacherInstructor: false,
      individual: false,
      volunteer: false,
    })
    expect(reasons).toContain('recruit.institution.announcementPublished')
    expect(reasons).toContain('recruit.institution.notes')
  })

  it('notesNotApplicable이면 비고는 필수가 아니다', () => {
    const values = filledRhf({
      recruitment: filledRecruit({ notes: '', notesNotApplicable: true }),
    })
    registerCompanySchoolRegistrationRhf(mockRhfApi(values))
    const reasons = listIncompleteEconomyProgramRecruitmentRequiredFields({
      organization: true,
      teacherInstructor: false,
      individual: false,
      volunteer: false,
    })
    expect(reasons).not.toContain('recruit.institution.notes')
  })

  it('typed snapshot이 있으면 Legacy overlay를 무시한다', () => {
    const typed = filledRecruit()
    const imported = importLegacyCompanySchoolRecruitmentOverlay({
      [K.maxClassCount]: 99,
      [K.notes]: '레거시',
    })
    expect(imported.maxClassCount).toBe(99)
    expect(typed.maxClassCount).toBe(20)
    expect(typed.notes).not.toBe(imported.notes)
    const restored = rhfValuesFromCompanySchoolCanonical(
      createDefaultCompanySchoolRegistrationRhfValues(),
      undefined,
      typed
    )
    expect(restored.recruitment.maxClassCount).toBe(20)
    expect(restored.recruitment.notes).toBe('RHF 비고')
  })

  it('legacy import는 키 존재 기준으로 명시적 빈 값을 살린다', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({
      overlay: {
        [K.notes]: '',
        [K.targetLevels]: [],
        [K.notesNotApplicable]: false,
        'economyRecruit.detailInfo.additionalContentHtml': '',
      },
    })
    expect(imported.recruit?.notes).toBe('')
    expect(imported.recruit?.targetLevels).toEqual([])
    expect(imported.recruit?.notesNotApplicable).toBe(false)
    expect(imported.recruit?.detailInfo.additionalContentHtml).toBe('')
  })

  it('persist overlay omit은 공통·기관 모집 키를 뺀다', () => {
    const overlay = omitCompanySchoolRecruitmentOverlayKeys(
      omitCompanySchoolCommonInfoOverlayKeys({
        'economyRegistration.basicInfo.repKo': '공통',
        [K.maxClassCount]: 20,
        'economyRecruit.detailInfo.additionalContentHtml': '<p>x</p>',
        'application.instructor.notes': '강사 leftover',
      })
    )
    expect(overlay['economyRegistration.basicInfo.repKo']).toBeUndefined()
    expect(overlay[K.maxClassCount]).toBeUndefined()
    expect(overlay['economyRecruit.detailInfo.additionalContentHtml']).toBeUndefined()
    expect(overlay['application.instructor.notes']).toBe('강사 leftover')
  })

  it('editorState snapshot은 왕복된다', () => {
    const state = filledRecruit()
    const editorState = companySchoolRecruitEditorState(state)
    expect(readCompanySchoolRecruitEditorState(editorState)?.maxClassCount).toBe(20)
    expect(readCompanySchoolRecruitEditorState(editorState)?.detailInfo.thumbFileObjectId).toBe(77)
  })

  it('기관 모집 patch는 store가 아니라 RHF로 가고 공통 dirty 값을 유지한다', () => {
    const values = filledRhf({ publicProgramTitle: '공통 dirty' })
    const api = mockRhfApi(values)
    registerCompanySchoolRegistrationRhf(api)
    patchApplicantRecruitInstitutionOverlay({ [K.maxClassCount]: 8 })
    patchGeneralRecruitOverlay({
      'economyRecruit.detailInfo.additionalContentHtml': '<p>flush</p>',
    })
    expect(api.getValues().recruitment.maxClassCount).toBe(8)
    expect(api.getValues().recruitment.detailInfo.additionalContentHtml).toBe('<p>flush</p>')
    expect(api.getValues().publicProgramTitle).toBe('공통 dirty')
    expect(api.isDirty()).toBe(true)
    expect(
      peekApplicantRecruitInstitutionOverlayRecord('recruitment-instructor')[K.maxClassCount]
    ).not.toBe(8)
  })

  it('WYSIWYG flush HTML은 general recruit peek에도 RHF가 반영된다', () => {
    const values = filledRhf()
    registerCompanySchoolRegistrationRhf(mockRhfApi(values))
    patchGeneralRecruitOverlay({
      'economyRecruit.detailInfo.additionalContentHtml': '<p>최신</p>',
      'recruit.detailInfo.additionalContentHtml': '<p>최신</p>',
    })
    const peeked = peekGeneralRecruitOverlayRecord('recruitment-economy')
    expect(peeked['economyRecruit.detailInfo.additionalContentHtml']).toBe('<p>최신</p>')
    expect(peeked['recruit.detailInfo.additionalContentHtml']).toBe('<p>최신</p>')
  })
})
