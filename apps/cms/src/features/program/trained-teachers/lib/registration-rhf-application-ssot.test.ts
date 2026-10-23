import { describe, expect, it } from 'vitest'
import { mapTrainedTeacherToCreateRequest } from '@/features/program/trained-teachers/api/adapters'
import { buildTrainedTeachersProgramFromRhf } from './build-registration-create-from-canonical'
import { importLegacyOverlayToTrainedTeachersCanonical } from './import-legacy-registration-overlay'
import {
  applyTrainedTeachersApplicationOverlayRecord,
  emptyTrainedTeachersApplicationFormState,
  importLegacyTrainedTeachersApplicationOverlay,
  persistableTrainedTeachersPreferredSchedules,
  serializeTrainedTeachersApplicationForFormVersion,
} from './registration-rhf-application'
import { createDefaultTrainedTeachersRegistrationRhfValues } from './registration-rhf-values'
import { listIncompleteTrainedTeachersApplicationRequiredFields } from './trained-teachers-application-required-fields'
import { serializeTrainedTeachersRecruitmentForFormVersion } from './registration-rhf-recruitment'

const BASIC = 'application.trainedTeachers.basicInfo'
const SCHEDULES = 'application.trainedTeachers.preferredSchedules'

function filledApplication() {
  return {
    ...emptyTrainedTeachersApplicationFormState(),
    basicInfo: {
      applicationGrade: '3',
      classCount: '2',
      educationFormat: 'offline',
      educationPlace: 'outside',
      detailAddress: '서울 중구',
      totalStudents: '48',
      educationPlaceDetail: '',
      teacherTel: '02-111-1111',
      teacherMobile: '010-2222-3333',
      teacherEmail: 'tt@example.com',
      applicationReason: 'RHF 사유',
      otherRequests: '',
    },
    preferredSchedules: [
      {
        date: '2026-04-01',
        session: '1',
        times: [{ classPeriod: '1교시', start: '10:00', end: '11:00' }],
      },
    ],
  }
}

function staleOverlay() {
  return {
    [`${BASIC}.applicationGrade`]: '6',
    [`${BASIC}.classCount`]: '9',
    [`${BASIC}.educationFormat`]: 'online',
    [`${BASIC}.educationPlace`]: 'inside',
    [`${BASIC}.detailAddress`]: '오래된 주소',
    [`${BASIC}.totalStudents`]: '99',
    [`${BASIC}.educationPlaceDetail`]: '오래된 장소상세',
    [`${BASIC}.teacherTel`]: '02-000-0000',
    [`${BASIC}.teacherMobile`]: '010-0000-0000',
    [`${BASIC}.teacherEmail`]: 'old@example.com',
    [`${BASIC}.applicationReason`]: '오래된 사유',
    [`${BASIC}.otherRequests`]: '오래된 요청',
    [SCHEDULES]: [{ date: '2020-01-01', times: [{ classPeriod: 'old', start: '09:00', end: '10:00' }] }],
  }
}

describe('TT 등록 신청 RHF SSOT', () => {
  it('RHF와 Overlay가 달라도 PUT은 RHF를 쓴다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.application = filledApplication()
    const afterStale = applyTrainedTeachersApplicationOverlayRecord(
      emptyTrainedTeachersApplicationFormState(),
      staleOverlay()
    )
    expect(afterStale.basicInfo.applicationGrade).toBe('6')

    const overlay = serializeTrainedTeachersApplicationForFormVersion(values.application)
    expect(overlay[`${BASIC}.applicationGrade`]).toBe('3')
    expect(overlay[`${BASIC}.classCount`]).toBe('2')
    expect(overlay[`${BASIC}.educationFormat`]).toBe('offline')
    expect(overlay[`${BASIC}.educationPlace`]).toBe('outside')
    expect(overlay[`${BASIC}.detailAddress`]).toBe('서울 중구')
    expect(overlay[`${BASIC}.totalStudents`]).toBe('48')
    expect(overlay[`${BASIC}.educationPlaceDetail`]).toBe('')
    expect(overlay[`${BASIC}.teacherTel`]).toBe('02-111-1111')
    expect(overlay[`${BASIC}.teacherMobile`]).toBe('010-2222-3333')
    expect(overlay[`${BASIC}.teacherEmail`]).toBe('tt@example.com')
    expect(overlay[`${BASIC}.applicationReason`]).toBe('RHF 사유')
    expect(overlay[`${BASIC}.otherRequests`]).toBe('')
    expect(overlay[SCHEDULES]).toEqual([
      {
        date: '2026-04-01',
        session: '1',
        times: [{ classPeriod: '1교시', start: '10:00', end: '11:00' }],
      },
    ])
    expect(JSON.stringify(overlay)).not.toContain('application.institution')
    expect(JSON.stringify(overlay)).not.toContain('recruit.')
  })

  it('명시적 빈 값은 stale Overlay를 복원하지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.application = {
      ...filledApplication(),
      basicInfo: {
        ...filledApplication().basicInfo,
        otherRequests: '',
        applicationReason: '',
        educationPlaceDetail: '',
      },
      preferredSchedules: [],
    }
    const overlay = serializeTrainedTeachersApplicationForFormVersion(values.application)
    expect(overlay[`${BASIC}.otherRequests`]).toBe('')
    expect(overlay[`${BASIC}.applicationReason`]).toBe('')
    expect(overlay[`${BASIC}.educationPlaceDetail`]).toBe('')
    expect(overlay[SCHEDULES]).toEqual([])
    const imported = importLegacyTrainedTeachersApplicationOverlay(staleOverlay())
    expect(imported.basicInfo.otherRequests).toBe('오래된 요청')
    expect(values.application.basicInfo.otherRequests).toBe('')
    expect(values.application.preferredSchedules).toEqual([])
  })

  it('UI placeholder 행은 Form Version에 일정으로 넣지 않는다', () => {
    const persisted = persistableTrainedTeachersPreferredSchedules([
      { date: null, times: [{ classPeriod: '', start: null, end: null }] },
    ])
    expect(persisted).toEqual([])
    const overlay = serializeTrainedTeachersApplicationForFormVersion({
      ...emptyTrainedTeachersApplicationFormState(),
      preferredSchedules: [{ date: null, times: [{ classPeriod: '', start: null, end: null }] }],
    })
    expect(overlay[SCHEDULES]).toEqual([])
  })

  it('Dayjs·blob·다른 catalog 키를 Form Version에 넣지 않는다', () => {
    const overlay = serializeTrainedTeachersApplicationForFormVersion({
      ...filledApplication(),
      preferredSchedules: [
        {
          date: '2026-04-01',
          session: '1',
          times: [{ classPeriod: '1교시', start: '10:00', end: '11:00' }],
        },
      ],
    })
    const encoded = JSON.stringify(overlay)
    expect(encoded).not.toContain('$d')
    expect(encoded).not.toContain('blob:')
    expect(encoded).not.toContain('application.institution')
    expect(encoded).not.toContain('application.economy')
    expect(() => JSON.parse(encoded)).not.toThrow()
    expect((overlay[SCHEDULES] as Array<{ date: string }> )[0].date).toBe('2026-04-01')
  })

  it('날짜가 UTC 직렬화로 하루 밀리지 않는다', () => {
    const overlay = serializeTrainedTeachersApplicationForFormVersion({
      ...emptyTrainedTeachersApplicationFormState(),
      preferredSchedules: [
        {
          date: '2026-04-01',
          times: [{ classPeriod: '1', start: '09:00', end: '10:00' }],
        },
      ],
    })
    expect((overlay[SCHEDULES] as Array<{ date: string | null }>)[0]?.date).toBe('2026-04-01')
  })

  it('제한 감소 시 초과 입력을 자동 삭제하지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.recruitment.maxClassCount = 1
    values.recruitment.maxScheduleCount = 1
    values.application = {
      ...filledApplication(),
      basicInfo: { ...filledApplication().basicInfo, classCount: '3' },
      preferredSchedules: [
        { date: '2026-04-01', times: [{ classPeriod: '1', start: '09:00', end: '10:00' }] },
        { date: '2026-04-02', times: [{ classPeriod: '1', start: '09:00', end: '10:00' }] },
      ],
    }
    expect(values.application.basicInfo.classCount).toBe('3')
    expect(values.application.preferredSchedules).toHaveLength(2)
    expect(listIncompleteTrainedTeachersApplicationRequiredFields(values)).toEqual(
      expect.arrayContaining([
        'application.trainedTeachers.basicInfo.classCount',
        'application.trainedTeachers.preferredSchedules',
      ])
    )
  })

  it('SCHEDULE + MULTI 숨김 희망 일정은 유령 필수가 아니다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues({
      educationStructure: 'schedule',
      sessionRound: 'multi',
    })
    values.application = emptyTrainedTeachersApplicationFormState()
    expect(listIncompleteTrainedTeachersApplicationRequiredFields(values)).toEqual([])
  })

  it('숨긴 교육 형태 빈 값을 필수로 요구하지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.application.basicInfo.educationFormat = ''
    expect(listIncompleteTrainedTeachersApplicationRequiredFields(values)).not.toContain(
      'application.trainedTeachers.basicInfo.educationFormat'
    )
  })

  it('Program CREATE에 application.* 가 없다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.application = filledApplication()
    const program = buildTrainedTeachersProgramFromRhf({ id: 'tt-app', values })
    expect(JSON.stringify(program)).not.toContain('application.trainedTeachers')
    expect(program.registrationOverlay).toBeUndefined()
    const request = mapTrainedTeacherToCreateRequest(program)
    expect(JSON.stringify(request)).not.toContain('application.trainedTeachers')
    expect(JSON.parse(String(request.serviceDetailJson)).registration).toBeUndefined()
  })

  it('typed snapshot이 있으면 Legacy overlay를 무시한다', () => {
    const typed = filledApplication()
    const imported = importLegacyTrainedTeachersApplicationOverlay(staleOverlay())
    expect(imported.basicInfo.applicationGrade).toBe('6')
    expect(typed.basicInfo.applicationGrade).toBe('3')
    expect(typed.preferredSchedules).toHaveLength(1)
  })

  it('legacy importer는 overlay 인자로만 신청값을 읽는다', () => {
    const imported = importLegacyOverlayToTrainedTeachersCanonical({
      id: 'legacy-app',
      editor: {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 1,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
        educationScheduleMode: 'date',
        teacherTrainingEnabled: false,
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        },
      },
      overlay: staleOverlay(),
    })
    expect(imported.application.basicInfo.applicationGrade).toBe('6')
    expect(imported.application.preferredSchedules[0]?.date).toBe('2020-01-01')
  })

  it('모집 serializer와 신청 serializer가 키를 섞지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.application = filledApplication()
    const recruitOverlay = serializeTrainedTeachersRecruitmentForFormVersion(values.recruitment)
    const applicationOverlay = serializeTrainedTeachersApplicationForFormVersion(values.application)
    expect(JSON.stringify(recruitOverlay)).not.toContain('application.trainedTeachers')
    expect(JSON.stringify(applicationOverlay)).not.toContain('recruit.')
    expect(JSON.stringify(applicationOverlay)).not.toContain('trainedTeachersRecruit')
  })
})
