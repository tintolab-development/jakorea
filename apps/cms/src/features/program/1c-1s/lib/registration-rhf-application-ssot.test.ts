/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import {
  patchGeneralApplicationOverlay,
  peekGeneralApplicationOverlayRecord,
  resetGeneralApplicationOverlayStoreForTests,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { hasIncompleteEconomyProgramApplicationRequiredFields } from '@/features/program/general/lib/economy-program-registration-required-fields'
import { patchInstitutionSexOffenseConsentSubmissionRequest } from '@/features/program/general/lib/institution-application-form-visibility'
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
import {
  emptyCompanySchoolApplicationFormState,
  importLegacyCompanySchoolApplicationOverlay,
  omitCompanySchoolApplicationOverlayKeys,
  persistCompanySchoolPreferredScheduleBlock,
  serializeCompanySchoolApplicationForFormVersion,
} from './registration-rhf-application'
import { serializeCompanySchoolRecruitmentForFormVersion } from './registration-rhf-recruitment'
import { serializeCompanySchoolRegistrationForFormVersion } from './serialize-registration-overlay-from-canonical'
import type { CompanySchoolApplicationFormState } from './registration-canonical-types'
import {
  companySchoolApplicationEditorState,
  readCompanySchoolApplicationEditorState,
} from './application-form-state'

function filledApplication(
  patch: Partial<CompanySchoolApplicationFormState> = {}
): CompanySchoolApplicationFormState {
  return {
    ...emptyCompanySchoolApplicationFormState(),
    basicInfo: {
      applicationGrade: '3',
      classCount: '2',
      totalStudents: '40',
      educationFormat: 'online',
      educationPlace: 'inside',
      educationPlaceDetail: '본관',
      detailAddress: '서울',
      teacherTel: '02-000',
      teacherMobile: '010-0000',
      teacherEmail: 't@a.com',
      applicationReason: '사유',
      otherRequests: '없음',
    },
    guidanceAnswers: {
      'computer-in-room': '있음',
      'waiting-place': '연구실',
      meal: '불가',
      'other-notes': '없음',
    },
    lessonReply: { companyType: 'partner', customCompanyName: '' },
    previousYearParticipation: 'no',
    schedule: {
      first: {
        date: '2026-09-10',
        session: '1',
        firstClassPeriod: '1',
        firstStart: '09:00',
        firstEnd: '09:40',
        secondClassPeriod: '',
        secondStart: null,
        secondEnd: null,
      },
      second: {
        date: '2026-09-11',
        session: '2',
        firstClassPeriod: '2',
        firstStart: '10:00',
        firstEnd: '10:40',
        secondClassPeriod: '3',
        secondStart: '11:00',
        secondEnd: '11:40',
      },
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
    sponsorId: 'sponsor-live-b',
    managerContactIds: ['contact-rhf'],
    educationCourse: 'ja',
    participantCount: 20,
    instructor: 4,
    paymentItemValues: ['p-new'],
    application: filledApplication(),
    ...patch,
  }
}

function mockRhfApi(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationRhfApi {
  let current = values
  return {
    getValues: () => current,
    getPath: path =>
      path === 'application'
        ? current.application
        : path === 'recruitment'
          ? current.recruitment
          : undefined,
    setPath: (path, value) => {
      if (path === 'application') {
        current = {
          ...current,
          application: value as CompanySchoolRegistrationRhfValues['application'],
        }
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

describe('1사1교 등록 기관 신청 RHF SSOT', () => {
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetGeneralApplicationOverlayStoreForTests()
    patchInstitutionSexOffenseConsentSubmissionRequest('no_submit')
  })

  it('기본정보 12개 키를 읽고 쓰며 명시적 빈 값을 보존한다', () => {
    const values = filledRhf()
    const overlay = serializeCompanySchoolApplicationForFormVersion(values.application)
    expect(overlay['application.economy.basicInfo.applicationGrade']).toBe('3')
    expect(overlay['application.economy.basicInfo.classCount']).toBe('2')
    expect(overlay['application.economy.basicInfo.totalStudents']).toBe('40')
    expect(overlay['application.economy.basicInfo.educationFormat']).toBe('online')
    expect(overlay['application.economy.basicInfo.educationPlace']).toBe('inside')
    expect(overlay['application.economy.basicInfo.educationPlaceDetail']).toBe('본관')
    expect(overlay['application.economy.basicInfo.detailAddress']).toBe('서울')
    expect(overlay['application.economy.basicInfo.teacherTel']).toBe('02-000')
    expect(overlay['application.economy.basicInfo.teacherMobile']).toBe('010-0000')
    expect(overlay['application.economy.basicInfo.teacherEmail']).toBe('t@a.com')
    expect(overlay['application.economy.basicInfo.applicationReason']).toBe('사유')
    expect(overlay['application.economy.basicInfo.otherRequests']).toBe('없음')

    const emptied = applyCompanySchoolRhfOverlayRecord(values, {
      'application.economy.basicInfo.applicationGrade': '',
      'application.economy.basicInfo.classCount': '',
      'application.economy.basicInfo.totalStudents': '',
      'application.economy.basicInfo.educationFormat': '',
      'application.economy.basicInfo.educationPlace': '',
    })
    expect(emptied.application.basicInfo.applicationGrade).toBe('')
    expect(emptied.application.basicInfo.classCount).toBe('')
    expect(emptied.application.basicInfo.educationFormat).toBe('')
    expect(emptied.publicProgramTitle).toBe('RHF 공고명')
  })

  it('guidanceAnswers 한 키만 바꿔도 나머지를 유지한다', () => {
    const next = applyCompanySchoolRhfOverlayRecord(filledRhf(), {
      'application.economy.guidanceAnswers': { meal: '가능' },
    })
    expect(next.application.guidanceAnswers.meal).toBe('가능')
    expect(next.application.guidanceAnswers['computer-in-room']).toBe('있음')
    expect(next.application.guidanceAnswers['waiting-place']).toBe('연구실')
    expect(next.application.guidanceAnswers['other-notes']).toBe('없음')
  })

  it('lessonReply 세 값과 custom 조건부, sponsor는 P1 RHF를 쓴다', () => {
    const partner = filledApplication()
    const none = filledApplication({ lessonReply: { companyType: 'none', customCompanyName: '' } })
    const custom = filledApplication({
      lessonReply: { companyType: 'custom', customCompanyName: '직접입력' },
    })
    expect(serializeCompanySchoolApplicationForFormVersion(partner)['application.economy.lessonReply.companyType']).toBe('partner')
    expect(serializeCompanySchoolApplicationForFormVersion(none)['application.economy.lessonReply.companyType']).toBe('none')
    const customOverlay = serializeCompanySchoolApplicationForFormVersion(custom)
    expect(customOverlay['application.economy.lessonReply.companyType']).toBe('custom')
    expect(customOverlay['application.economy.lessonReply.customCompanyName']).toBe('직접입력')

    const values = filledRhf({ sponsorId: 'sponsor-live-b' })
    registerCompanySchoolRegistrationRhf(mockRhfApi(values))
    expect(values.sponsorId).toBe('sponsor-live-b')
    expect(JSON.stringify(serializeCompanySchoolApplicationForFormVersion(values.application))).not.toContain(
      'sponsor-live-b'
    )
  })

  it('previousYearParticipation yes/no/empty를 보존한다', () => {
    expect(
      applyCompanySchoolRhfOverlayRecord(filledRhf(), {
        'application.economy.previousYearParticipation': 'yes',
      }).application.previousYearParticipation
    ).toBe('yes')
    expect(
      applyCompanySchoolRhfOverlayRecord(filledRhf(), {
        'application.economy.previousYearParticipation': '',
      }).application.previousYearParticipation
    ).toBe('')
  })

  it('1·2지망 일정은 primitive이고 Dayjs/Blob/circular이 없다', () => {
    const overlay = serializeCompanySchoolApplicationForFormVersion(filledApplication())
    const first = overlay['application.economy.schedule.first'] as Record<string, unknown>
    const second = overlay['application.economy.schedule.second'] as Record<string, unknown>
    expect(first.date).toBe('2026-09-10')
    expect(first.session).toBe('1')
    expect(first.firstStart).toBe('09:00')
    expect(second.session).toBe('2')
    expect(second.secondStart).toBe('11:00')
    const roundTrip = JSON.parse(JSON.stringify(overlay)) as Record<string, unknown>
    expect(roundTrip['application.economy.schedule.first']).toEqual(first)
    expect(JSON.stringify(overlay)).not.toContain('$d')
    expect(JSON.stringify(overlay)).not.toContain('_isAMomentObject')
    expect(JSON.stringify(overlay)).not.toContain('blob:')
  })

  it('서울 날짜 경계를 UTC로 하루 밀지 않는다', () => {
    const block = persistCompanySchoolPreferredScheduleBlock({
      date: '2026-03-01T15:00:00.000Z',
      session: '1',
      firstClassPeriod: '1',
      firstStart: '2026-03-01T00:00:00.000Z',
      firstEnd: '2026-03-01T00:40:00.000Z',
    })
    expect(block.date).toBe('2026-03-02')
    expect(block.firstStart).toBe('09:00')
    expect(block.firstEnd).toBe('09:40')
  })

  it('session=1은 2차시 시간 없이, session=2는 둘 다 필요하다', () => {
    patchInstitutionSexOffenseConsentSubmissionRequest('no_submit')
    registerCompanySchoolRegistrationRhf(
      mockRhfApi(
        filledRhf({
          application: filledApplication({
            schedule: {
              first: filledApplication().schedule.first,
              second: {
                ...filledApplication().schedule.second,
                session: '2',
                secondStart: null,
                secondEnd: null,
              },
            },
          }),
        })
      )
    )
    expect(hasIncompleteEconomyProgramApplicationRequiredFields()).toBe(true)
    registerCompanySchoolRegistrationRhf(mockRhfApi(filledRhf()))
    expect(hasIncompleteEconomyProgramApplicationRequiredFields()).toBe(false)
  })

  it('신청 수정은 P1/P2 값과 기간을 바꾸지 않는다', () => {
    const values = filledRhf({
      operationRange: { start: '2026-01-10', end: '2026-11-30' },
    })
    values.recruitment.programRange = { start: '2026-04-01', end: '2026-12-31' }
    values.recruitment.recruitRange = { start: '2026-03-01', end: '2026-03-31' }
    const next = applyCompanySchoolRhfOverlayRecord(values, {
      'application.economy.basicInfo.detailAddress': '부산',
    })
    expect(next.operationRange).toEqual({ start: '2026-01-10', end: '2026-11-30' })
    expect(next.recruitment.programRange).toEqual({ start: '2026-04-01', end: '2026-12-31' })
    expect(next.recruitment.recruitRange).toEqual({ start: '2026-03-01', end: '2026-03-31' })
    expect(next.application.basicInfo.detailAddress).toBe('부산')
  })

  it('Form Version은 application.economy.*만 넣고 sexOffense/institution을 섞지 않는다', () => {
    const overlay = serializeCompanySchoolApplicationForFormVersion(filledApplication())
    for (const key of Object.keys(overlay)) {
      expect(key.startsWith('application.economy.')).toBe(true)
    }
    expect(JSON.stringify(overlay)).not.toContain('application.institution')
    expect(JSON.stringify(overlay)).not.toContain('sexOffense')
    expect(JSON.stringify(overlay)).not.toContain('application.instructor')
    expect(JSON.stringify(overlay)).not.toContain('economyRegistration')
    expect(JSON.stringify(overlay)).not.toContain('recruit.')
  })

  it('Program CREATE에 application.economy가 들어가지 않고 P1/P2는 유지된다', () => {
    const values = filledRhf()
    const program = buildCompanySchoolProgramFromRhf({ id: 'cs-app', values })
    expect(JSON.stringify(program)).not.toContain('application.economy')
    expect(program.generalCommonInfo?.announcementTitle).toBe('RHF 공고명')
    expect(program.registrationOverlay?.['economyRegistration.wageInfo.paymentItemValues']).toEqual([
      'p-new',
    ])
    const common = serializeCompanySchoolRegistrationForFormVersion(values)
    expect(common['economyRegistration.basicInfo.publicProgramTitle']).toBe('RHF 공고명')
    const recruit = serializeCompanySchoolRecruitmentForFormVersion(values.recruitment)
    expect(recruit['recruit.announcementPublished']).toBe('published')
  })

  it('typed snapshot에 application이 없으면 common/recruit를 유지하고 application만 import한다', () => {
    const current = filledRhf()
    const typedCommon = createDefaultCompanySchoolRegistrationRhfValues()
    const imported = importLegacyCompanySchoolApplicationOverlay({
      'application.economy.basicInfo.detailAddress': '레거시주소',
    })
    const restored = rhfValuesFromCompanySchoolCanonical(
      { ...typedCommon, publicProgramTitle: '유지된 공통' },
      undefined,
      current.recruitment,
      imported
    )
    expect(restored.publicProgramTitle).toBe('유지된 공통')
    expect(restored.recruitment).toEqual(current.recruitment)
    expect(restored.application.basicInfo.detailAddress).toBe('레거시주소')
  })

  it('legacy import는 키 존재 기준으로 명시적 빈 값을 살린다', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({
      overlay: {
        'application.economy.basicInfo.educationFormat': '',
        'application.economy.previousYearParticipation': '',
        'application.economy.guidanceAnswers': { meal: '' },
      },
    })
    expect(imported.application?.basicInfo.educationFormat).toBe('')
    expect(imported.application?.previousYearParticipation).toBe('')
    expect(imported.application?.guidanceAnswers.meal).toBe('')
    expect(imported.application?.guidanceAnswers['computer-in-room']).toBe('')
  })

  it('application patch는 store가 아니라 RHF로 가고 공통 dirty를 유지한다', () => {
    const values = filledRhf({ publicProgramTitle: '공통 dirty' })
    const api = mockRhfApi(values)
    registerCompanySchoolRegistrationRhf(api)
    patchGeneralApplicationOverlay({
      'application.economy.basicInfo.detailAddress': '대구',
    })
    expect(api.getValues().application.basicInfo.detailAddress).toBe('대구')
    expect(api.getValues().publicProgramTitle).toBe('공통 dirty')
    expect(api.isDirty()).toBe(true)
    expect(
      peekGeneralApplicationOverlayRecord('application-instructor')[
        'application.economy.basicInfo.detailAddress'
      ]
    ).toBeUndefined()
  })

  it('guidance 한 필드 updateKey가 다른 답을 지우지 않는다', () => {
    const api = mockRhfApi(filledRhf())
    registerCompanySchoolRegistrationRhf(api)
    updateGeneralApplicationOverlayKey<Record<string, string>>(
      'application.economy.guidanceAnswers',
      prev => ({ ...(prev ?? {}), meal: '가능' })
    )
    expect(api.getValues().application.guidanceAnswers.meal).toBe('가능')
    expect(api.getValues().application.guidanceAnswers['waiting-place']).toBe('연구실')
  })

  it('persist overlay omit은 application.economy를 빼고 instructor leftover를 남긴다', () => {
    const overlay = omitCompanySchoolApplicationOverlayKeys({
      'application.economy.basicInfo.detailAddress': '서울',
      'application.instructor.notes': '강사 leftover',
    })
    expect(overlay['application.economy.basicInfo.detailAddress']).toBeUndefined()
    expect(overlay['application.instructor.notes']).toBe('강사 leftover')
  })

  it('editorState snapshot은 왕복된다', () => {
    const state = filledApplication()
    expect(readCompanySchoolApplicationEditorState(companySchoolApplicationEditorState(state))?.basicInfo.detailAddress).toBe(
      '서울'
    )
  })
})
