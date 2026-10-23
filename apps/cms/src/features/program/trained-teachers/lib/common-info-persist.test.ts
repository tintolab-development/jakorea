import { describe, expect, it } from 'vitest'
import {
  applyTrainedTeachersProgressGroupsToScheduleDetails,
  buildTrainedTeachersCommonInfoSaveSlices,
  buildTrainedTeachersNestedCommonInfo,
  omitTrainedTeacherStaleSessionOverlayKeys,
  resolveTrainedTeachersCanonicalCommonInfo,
} from './common-info-persist'
import { serializeTrainedTeacherServiceDetailJson } from '@/features/program/trained-teachers/api/service-detail-json'
import { mapTrainedTeacherInfoSaveToRequest } from '@/features/program/trained-teachers/api/info-detail-adapters'
import type { Program } from '@/types/domain'

describe('buildTrainedTeachersNestedCommonInfo', () => {
  it('커리큘럼형이면 일정 nested를 명시 빈 배열로 보낸다', () => {
    expect(
      buildTrainedTeachersNestedCommonInfo({
        educationStructure: 'curriculum',
        curriculumSessions: [
          { sessionLabel: '1회차', title: '1', description: '본문' },
          { sessionLabel: '2회차', title: '2', description: '본문2' },
        ],
        scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: 'stale' }],
      })
    ).toEqual({
      curriculumSessions: [
        { sessionLabel: '1회차', title: '1', description: '본문' },
        { sessionLabel: '2회차', title: '2', description: '본문2' },
      ],
      scheduleDetails: [],
    })
  })

  it('일정형이면 커리큘럼 nested를 명시 빈 배열로 보낸다', () => {
    expect(
      buildTrainedTeachersNestedCommonInfo({
        educationStructure: 'schedule',
        curriculumSessions: [{ sessionLabel: '1회차', title: 'stale', description: '' }],
        scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '행사' }],
      })
    ).toEqual({
      curriculumSessions: [],
      scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '행사' }],
    })
  })
})

describe('omitTrainedTeacherStaleSessionOverlayKeys', () => {
  it('전환된 공통정보 overlay는 빼고 설문 미러와 모집/신청 키만 남긴다', () => {
    expect(
      omitTrainedTeacherStaleSessionOverlayKeys({
        'trainedTeachersRegistration.basicInfo.surveyItems': { survey: true },
        'trainedTeachersRegistration.basicInfo.publicProgramTitle': '공고',
        'trainedTeachersRegistration.basicInfo.detailedProgramId': '163010',
        'trainedTeachersRegistration.basicInfo.sponsorId': '1627251',
        'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': 'yes',
        'trainedTeachersRegistration.educationCurriculum.unitNameBySession': { 1: '유령 3회차' },
        'trainedTeachersRegistration.educationScheduleCurriculum.eventNameByDetail': {
          1: 'stale',
        },
        'trainedTeachersRegistration.educationScheduleSettings.scheduleLines': [
          '2026.11.06(금) 10:00 ~ 12:00',
        ],
        'generalRegistration.educationScheduleSettings.scheduleLines': ['stale date'],
        'application.institution.teacherTel': '02-000-0000',
      })
    ).toEqual({
      'trainedTeachersRegistration.basicInfo.surveyItems': { survey: true },
      'application.institution.teacherTel': '02-000-0000',
    })
  })
})

describe('applyTrainedTeachersProgressGroupsToScheduleDetails', () => {
  it('단일 회차 진행 그룹을 progressTimeSummary로 합친다', () => {
    expect(
      applyTrainedTeachersProgressGroupsToScheduleDetails(
        [{ scheduleLabel: '세부 일정 01', name: 'A' }],
        [['09:30 ~ 10:00', '13:00 ~ 14:00']],
        'single'
      )
    ).toEqual([
      {
        scheduleLabel: '세부 일정 01',
        name: 'A',
        progressTimeSummary: '그룹 A : 09:30 ~ 10:00 | 그룹 B : 13:00 ~ 14:00',
      },
    ])
  })
})

describe('TT persist nested SSOT', () => {
  it('serialize는 nested 2행을 유지하고 stale overlay 4행을 복원하지 않는다', () => {
    const program: Program = {
      id: '186009',
      sponsorId: '163302',
      title: '교육받은 교사',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      rounds: [],
      startDate: '2026-03-01',
      endDate: '2026-11-30',
      status: 'pending',
      backendProgramType: 'TRAINED_TEACHER',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalCommonInfo: {
        announcementTitle: '공고',
        curriculumSessions: [
          { sessionLabel: '1회차', title: '1', description: 'a' },
          { sessionLabel: '2회차', title: '2', description: 'b' },
        ],
        scheduleDetails: [],
      },
      registrationOverlay: {
        'trainedTeachersRegistration.educationCurriculum.unitNameBySession': {
          1: '1',
          2: '2',
          3: '3',
          4: '4',
        },
        'trainedTeachersRegistration.basicInfo.surveyItems': { survey: true },
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const parsed = JSON.parse(serializeTrainedTeacherServiceDetailJson(program)) as {
      program?: {
        generalCommonInfo?: {
          curriculumSessions?: unknown[]
          scheduleDetails?: unknown[]
        }
      }
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(parsed.program?.generalCommonInfo?.curriculumSessions).toHaveLength(2)
    expect(parsed.program?.generalCommonInfo?.scheduleDetails).toEqual([])
    expect(
      parsed.registration?.overlay?.['trainedTeachersRegistration.educationCurriculum.unitNameBySession']
    ).toBeUndefined()
    expect(
      parsed.registration?.overlay?.['trainedTeachersRegistration.basicInfo.surveyItems']
    ).toEqual({ survey: true })
  })

  it('B configJson은 draft nested만 싣고 공고·KPI는 빼다', () => {
    const nested = buildTrainedTeachersNestedCommonInfo({
      educationStructure: 'schedule',
      scheduleDetails: [
        { scheduleLabel: '세부 일정 01', name: '행사', progressTimeSummary: '10:00 ~ 11:00' },
      ],
      curriculumSessions: [{ sessionLabel: '1회차', title: 'stale', description: '' }],
    })
    const request = mapTrainedTeacherInfoSaveToRequest({
      educatedTeachers: 3,
      commonInfo: {
        announcementTitle: '공고는 B에 없음',
        kpi: {
          finalParticipants: 99,
          instructorCount: 0,
          volunteerCount: 0,
          finalSchools: 1,
          finalClasses: 1,
        },
        educationJournalEnabled: true,
        teacherTrainingEnabled: false,
        ...nested,
      },
    })
    expect(request.configJson).not.toContain('announcementTitle')
    expect(request.configJson).not.toContain('finalParticipants')
    expect(request.configJson).toContain('행사')
    expect(request.configJson).toContain('"curriculumSessions":[]')
    expect(request.configJson).toContain('세부 일정 01')
  })
})

describe('resolveTrainedTeachersCanonicalCommonInfo', () => {
  it('canonical 값이 있으면 overlay 후원사·세부프로그램·일정을 쓰지 않는다', () => {
    const resolved = resolveTrainedTeachersCanonicalCommonInfo({
      id: '186312',
      sponsorId: '1627253',
      title: '교교 수정테스트32323',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      rounds: [],
      startDate: '2026-03-01',
      endDate: '2026-11-30',
      status: 'pending',
      backendProgramType: 'TRAINED_TEACHER',
      detailedProgramId: '163009',
      generalCommonInfo: {
        teacherTrainingEnabled: true,
        educationJournalEnabled: false,
        educationScheduleMode: 'period',
        educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
        curriculumSessions: [
          { sessionLabel: '1회차', title: '1', description: 'a' },
          { sessionLabel: '2회차', title: '2', description: 'b' },
        ],
      },
      registrationOverlay: {
        'trainedTeachersRegistration.basicInfo.detailedProgramId': '163010',
        'trainedTeachersRegistration.basicInfo.sponsorId': '1627251',
        'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': 'yes',
        'trainedTeachersRegistration.educationScheduleSettings.scheduleLines': [
          '2026.11.06(금) 10:00 ~ 12:00',
        ],
        'trainedTeachersRegistration.educationCurriculum.unitNameBySession': {
          1: '1',
          2: '2',
          3: 'stale',
        },
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(resolved.teacherTrainingEnabled).toBe(true)
    expect(resolved.educationJournalEnabled).toBe(false)
    expect(resolved.educationScheduleLines).toEqual(['2026.10.29 ~ 2026.10.31'])
    expect(resolved.curriculumSessions).toHaveLength(2)
  })

  it('canonical journal 이 없으면 overlay yes/no 만 fallback 한다', () => {
    const resolved = resolveTrainedTeachersCanonicalCommonInfo({
      id: '186312',
      sponsorId: '1',
      title: 't',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      rounds: [],
      startDate: '2026-03-01',
      endDate: '2026-11-30',
      status: 'pending',
      backendProgramType: 'TRAINED_TEACHER',
      generalCommonInfo: {},
      registrationOverlay: {
        'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': 'yes',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(resolved.educationJournalEnabled).toBe(true)
    expect(resolved.teacherTrainingEnabled).toBe(false)
  })
})

describe('buildTrainedTeachersCommonInfoSaveSlices', () => {
  it('화면 입력 연수 true / 일지 false / 기간 지정 / 2회차를 A·B 동일하게 실는다', () => {
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      curriculumSessions: [
        { sessionLabel: '1회차', title: '1', description: 'a' },
        { sessionLabel: '2회차', title: '2', description: 'b' },
      ],
      scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: 'stale' }],
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
    })
    expect(slices.extraCommonInfo).toMatchObject({
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
      curriculumSessions: [
        { sessionLabel: '1회차', title: '1', description: 'a' },
        { sessionLabel: '2회차', title: '2', description: 'b' },
      ],
      scheduleDetails: [],
    })
    expect(slices.infoDetailCommonInfo).toEqual(slices.extraCommonInfo)
  })
})
