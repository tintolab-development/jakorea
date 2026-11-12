import { describe, expect, it } from 'vitest'
import {
  buildTeacherTrainingScheduleDetail,
  formatTeacherTrainingScheduleLine,
  isTeacherTrainingScheduleName,
  normalizeTeacherTrainingEducationFormat,
  resolveTeacherTrainingScheduleLine,
  resolveTeacherTrainingScheduleName,
  splitTeacherTrainingFromCommonInfo,
  teacherTrainingEducationFormatLabel,
} from './teacher-training-block'
import {
  mapTrainedTeacherInfoDetailToProgramPatch,
  mapTrainedTeacherInfoSaveToRequest,
  parseTrainedTeacherInfoConfigJson,
} from '../api/info-detail-adapters'
import {
  buildTrainedTeachersCommonInfoSaveSlices,
  buildTrainedTeachersNestedCommonInfo,
} from './common-info-persist'

describe('교사 연수 일정명', () => {
  it('대소문자·공백을 무시하고 연수 일정명을 찾는다', () => {
    expect(isTeacherTrainingScheduleName('교육 연수')).toBe(true)
    expect(isTeacherTrainingScheduleName(' 교사  연수 ')).toBe(true)
    expect(isTeacherTrainingScheduleName('여름 워크숍', '여름 워크숍')).toBe(true)
    expect(isTeacherTrainingScheduleName('1차시')).toBe(false)
  })

  it('저장된 이름을 유지하고 없을 때만 기본 「교육 연수」', () => {
    expect(resolveTeacherTrainingScheduleName('교사 연수')).toBe('교사 연수')
    expect(resolveTeacherTrainingScheduleName('')).toBe('교육 연수')
    expect(resolveTeacherTrainingScheduleName(undefined)).toBe('교육 연수')
  })
})

describe('교사 연수 교육 형태', () => {
  it('ONLINE/OFFLINE/HYBRID 로 정규화하고 그 외는 버린다', () => {
    expect(normalizeTeacherTrainingEducationFormat('offline')).toBe('OFFLINE')
    expect(normalizeTeacherTrainingEducationFormat('hybrid')).toBe('HYBRID')
    expect(normalizeTeacherTrainingEducationFormat('온/오프라인')).toBe('HYBRID')
    expect(normalizeTeacherTrainingEducationFormat('participant_choice')).toBeUndefined()
    expect(teacherTrainingEducationFormatLabel(null)).toBe('-')
    expect(teacherTrainingEducationFormatLabel('ONLINE')).toBe('온라인')
  })
})

describe('splitTeacherTrainingFromCommonInfo', () => {
  it('일정형 — 연수 행(name 일치)을 빼고 나머지 행은 화면 순서로 다시 번호', () => {
    const split = splitTeacherTrainingFromCommonInfo({
      enabled: true,
      scheduleName: '교육 연수',
      sessionRound: 'multi',
      scheduleDetails: [
        { scheduleLabel: '교육 연수', name: '교육 연수', scheduleDateLabel: '2026.04.01(수) 10:00 ~ 12:00' },
        { scheduleLabel: '행사 일정 02', name: '행사 A' },
        { scheduleLabel: '행사 일정 03', name: '행사 B' },
      ],
    })
    expect(split.trainingDetail?.name).toBe('교육 연수')
    expect(split.scheduleDetails.map(row => [row.scheduleLabel, row.name])).toEqual([
      ['행사 일정 01', '행사 A'],
      ['행사 일정 02', '행사 B'],
    ])
  })

  it('커리큘럼형 기존 데이터 — 첫 차시 치환 행에 단원·내용이 있으면 ■1차시로 남긴다(차시 유실 없음)', () => {
    const split = splitTeacherTrainingFromCommonInfo({
      enabled: true,
      scheduleName: '교육 연수',
      sessionRound: 'single',
      curriculumSessions: [
        { sessionLabel: '교육 연수', title: '연수 오리엔테이션', description: '교사 사전 연수' },
        { sessionLabel: '2차시', title: '단원2', description: '내용2' },
      ],
    })
    expect(split.trainingDetail).toBeUndefined()
    expect(split.curriculumSessions.map(row => [row.sessionLabel, row.title])).toEqual([
      ['1차시', '연수 오리엔테이션'],
      ['2차시', '단원2'],
    ])
  })

  it('커리큘럼형 기존 데이터 — 내용 없는 연수 표시 행은 빼서 같은 차시가 두 번 보이지 않게 한다', () => {
    const split = splitTeacherTrainingFromCommonInfo({
      enabled: true,
      scheduleName: '교육 연수',
      sessionRound: 'single',
      curriculumSessions: [
        { sessionLabel: '교육 연수', title: '교육 연수', description: '' },
        { sessionLabel: '2차시', title: '단원1', description: '내용1' },
      ],
      scheduleDetails: [
        { scheduleLabel: '교사 연수', name: '교육 연수', scheduleDateLabel: '2026.04.01(수) 10:00 ~ 12:00' },
      ],
    })
    expect(split.trainingDetail?.scheduleDateLabel).toBe('2026.04.01(수) 10:00 ~ 12:00')
    expect(split.curriculumSessions).toEqual([
      { sessionLabel: '1차시', title: '단원1', description: '내용1' },
    ])
    expect(split.scheduleDetails).toEqual([])
  })

  it('sessionNo 로 차시 번호를 만들지 않는다', () => {
    const split = splitTeacherTrainingFromCommonInfo({
      enabled: true,
      sessionRound: 'single',
      curriculumSessions: [
        { sessionNo: 2, sessionLabel: '2차시', title: '단원A', description: '' },
        { sessionNo: 5, sessionLabel: '5차시', title: '단원B', description: '' },
      ],
    })
    expect(split.curriculumSessions.map(row => row.sessionLabel)).toEqual(['1차시', '2차시'])
    expect(split.curriculumSessions.map(row => row.sessionNo)).toEqual([2, 5])
  })

  it('연수 OFF 면 행을 나누지 않는다', () => {
    const split = splitTeacherTrainingFromCommonInfo({
      enabled: false,
      sessionRound: 'multi',
      scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '행사 A' }],
    })
    expect(split.trainingDetail).toBeUndefined()
    expect(split.scheduleDetails).toHaveLength(1)
  })
})

describe('연수 일시 시드·저장 행', () => {
  it('행 일시(시간 포함) 우선, 없으면 GET teacherTrainingSchedule 투영', () => {
    expect(
      resolveTeacherTrainingScheduleLine({
        trainingDetail: { scheduleLabel: '교사 연수', name: '교육 연수', scheduleDateLabel: '2026.04.01(수) 10:00 ~ 12:00' },
      })
    ).toBe('2026.04.01(수) 10:00 ~ 12:00')
    expect(
      resolveTeacherTrainingScheduleLine({
        schedule: {
          scheduleId: 1,
          scheduleName: '교육 연수',
          startAt: '2026-04-01T01:00:00Z',
          endAt: '2026-04-01T08:00:00Z',
        },
      })
    ).toBe('2026.04.01(수) 10:00 ~ 17:00')
    expect(formatTeacherTrainingScheduleLine(null)).toBe('')
  })

  it('저장 행은 일정명 = 연수 일정명, scheduleRole·blockKind·과제 없음', () => {
    const row = buildTeacherTrainingScheduleDetail({
      scheduleName: '교육 연수',
      scheduleLine: '2026.04.01(수) 10:00 ~ 12:00',
      base: {
        scheduleLabel: '교육 연수',
        name: '교육 연수',
        blockKind: 'preEducation',
        progressTimeSummary: '10:00 ~ 11:00',
        assignmentEnabled: true,
      },
    })
    expect(row).toEqual({
      scheduleLabel: '교사 연수',
      name: '교육 연수',
      scheduleDateLabel: '2026.04.01(수) 10:00 ~ 12:00',
    })
  })
})

describe('B PATCH payload', () => {
  const trainingRow = {
    scheduleLabel: '교사 연수',
    name: '교사 연수',
    scheduleDateLabel: '2026.12.01(화) 10:00 ~ 17:00',
  }

  it('커리큘럼형 — scheduleDetails 연수 행 + teacherTrainingEducationFormat, 일정명은 서버 저장값', () => {
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      teacherTrainingScheduleName: '교사 연수',
      teacherTrainingEducationFormat: 'OFFLINE',
      teacherTrainingScheduleDetail: trainingRow,
      educationJournalEnabled: true,
      curriculumSessions: [{ sessionLabel: '1차시', title: '단원1', description: '' }],
      scheduleDetails: [],
    })
    const request = mapTrainedTeacherInfoSaveToRequest({ commonInfo: slices.infoDetailCommonInfo })
    expect(request.teacherTrainingEnabled).toBe(true)
    expect(request.teacherTrainingScheduleName).toBe('교사 연수')
    expect(request.teacherTrainingEducationFormat).toBe('OFFLINE')
    const config = parseTrainedTeacherInfoConfigJson(request.configJson)
    expect(config.generalCommonInfo?.scheduleDetails).toEqual([trainingRow])
    expect(config.generalCommonInfo?.curriculumSessions?.[0]?.sessionLabel).toBe('1차시')
    expect(request.configJson).not.toContain('scheduleRole')
    expect(request.configJson).not.toContain('teacherTrainingEducationFormat')
  })

  it('일정형 — 연수 행이 맨 앞, 나머지 행은 그대로', () => {
    const nested = buildTrainedTeachersNestedCommonInfo({
      educationStructure: 'schedule',
      scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '행사 A' }],
      teacherTrainingScheduleDetail: trainingRow,
    })
    expect(nested.scheduleDetails?.map(row => row.name)).toEqual(['교사 연수', '행사 A'])
    expect(nested.curriculumSessions).toEqual([])
  })

  it('연수 OFF — 연수 행·교육 형태를 보내지 않는다', () => {
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: false,
      teacherTrainingEducationFormat: 'ONLINE',
      educationJournalEnabled: false,
      curriculumSessions: [],
      scheduleDetails: [],
    })
    const request = mapTrainedTeacherInfoSaveToRequest({ commonInfo: slices.infoDetailCommonInfo })
    expect(request.teacherTrainingEnabled).toBe(false)
    expect(request.teacherTrainingScheduleName).toBe('')
    expect(request).not.toHaveProperty('teacherTrainingEducationFormat')
  })

  it('교육 형태 미선택 — 키를 생략해 서버 값을 유지한다', () => {
    const request = mapTrainedTeacherInfoSaveToRequest({
      commonInfo: { teacherTrainingEnabled: true, scheduleDetails: [trainingRow] },
    })
    expect(request).not.toHaveProperty('teacherTrainingEducationFormat')
    expect(request.teacherTrainingScheduleName).toBe('교육 연수')
  })
})

describe('GET detail 매핑', () => {
  it('teacherTrainingEducationFormat·teacherTrainingSchedule 을 generalCommonInfo 에 싣는다', () => {
    const patch = mapTrainedTeacherInfoDetailToProgramPatch({
      teacherTrainingEnabled: true,
      teacherTrainingScheduleName: '교육 연수',
      teacherTrainingEducationFormat: 'HYBRID',
      teacherTrainingSchedule: {
        scheduleId: 9,
        scheduleName: '교육 연수',
        startAt: '2026-04-01T01:00:00Z',
        endAt: '2026-04-01T03:00:00Z',
      },
    })
    expect(patch.generalCommonInfo?.teacherTrainingEducationFormat).toBe('HYBRID')
    expect(patch.generalCommonInfo?.teacherTrainingSchedule?.scheduleId).toBe(9)
  })

  it('필드가 없는 구 응답은 undefined 로 둔다', () => {
    const patch = mapTrainedTeacherInfoDetailToProgramPatch({ teacherTrainingEnabled: true })
    expect(patch.generalCommonInfo).not.toHaveProperty('teacherTrainingEducationFormat')
    expect(patch.generalCommonInfo).not.toHaveProperty('teacherTrainingSchedule')
  })
})

describe('등록 위저드 overlay → canonical (교사 연수 블록)', () => {
  const editorMeta = {
    educationStructure: 'curriculum' as const,
    sessionRound: 'single' as const,
    educationFormScheduleDetail: 'common' as const,
    participationScheduleDetail: 'common' as const,
    ipsScheduleDetail: 'common' as const,
    curriculumSessionCount: 1,
    curriculumChartSessionCount: 2,
    scheduleCurriculumDetailCount: 1,
    scheduleCurriculumGroupCount: 1,
    educationScheduleMode: 'period' as const,
    teacherTrainingEnabled: true,
    participant: { individual: false, organization: true, teacherInstructor: false, volunteer: false },
  }

  it('블록 진행 일정·교육 형태를 읽고 차시는 ■1차시부터 그대로 둔다', async () => {
    const { importLegacyOverlayToTrainedTeachersCanonical } = await import(
      './import-legacy-registration-overlay'
    )
    const canonical = importLegacyOverlayToTrainedTeachersCanonical({
      id: 'tt-import',
      editor: editorMeta,
      overlay: {
        'generalRegistration.educationCurriculum.preEducationScheduleLine':
          '2026.03.20(금) 10:00 ~ 17:00',
        'generalRegistration.educationCurriculum.educationFormBySession': { 0: 'hybrid' },
        'trainedTeachersRegistration.educationCurriculum.unitNameBySession': { 1: '단원1', 2: '단원2' },
        'trainedTeachersRegistration.educationCurriculum.unitContentBySession': {
          1: '내용1',
          2: '내용2',
        },
      },
    })
    expect(canonical.common.teacherTrainingScheduleLine).toBe('2026.03.20(금) 10:00 ~ 17:00')
    expect(canonical.common.teacherTrainingEducationFormat).toBe('HYBRID')
    expect(canonical.common.curriculumSessions.map(row => [row.sessionLabel, row.title])).toEqual([
      ['1차시', '단원1'],
      ['2차시', '단원2'],
    ])
  })

  it('연수 OFF 면 블록 값을 싣지 않는다', async () => {
    const { importLegacyOverlayToTrainedTeachersCanonical } = await import(
      './import-legacy-registration-overlay'
    )
    const canonical = importLegacyOverlayToTrainedTeachersCanonical({
      id: 'tt-import-off',
      editor: { ...editorMeta, teacherTrainingEnabled: false },
      overlay: {
        'generalRegistration.educationCurriculum.preEducationScheduleLine':
          '2026.03.20(금) 10:00 ~ 17:00',
      },
    })
    expect(canonical.common.teacherTrainingScheduleLine).toBeUndefined()
    expect(canonical.common.teacherTrainingEducationFormat).toBeUndefined()
  })
})
