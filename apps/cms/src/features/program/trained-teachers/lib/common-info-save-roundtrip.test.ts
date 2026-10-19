import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import {
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherToUpdateRequest,
} from '@/features/program/trained-teachers/api/adapters'
import {
  parseTrainedTeacherServiceDetailJson,
  serializeTrainedTeacherServiceDetailJson,
} from '@/features/program/trained-teachers/api/service-detail-json'
import {
  mapTrainedTeacherInfoSaveToRequest,
  mergeTrainedTeacherInfoDetailIntoProgram,
} from '@/features/program/trained-teachers/api/info-detail-adapters'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { stampTrainedTeachersSessionFields } from './stamp-session-fields'

function baseProgram(): Program {
  return {
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
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    totalParticipants: 30,
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      participantRecruitmentInfo: {
        announcementPublished: true,
        inquiryTel: '02-000-0000',
      },
      kpi: {
        finalParticipants: 30,
        instructorCount: 2,
        volunteerCount: 0,
        finalSchools: 4,
        finalClasses: 6,
      },
      curriculumSessions: [
        { sessionLabel: '1회차', title: '1회차', description: '', educationFormLabel: '오프라인' },
        { sessionLabel: '2회차', title: '2회차', description: '', educationFormLabel: '온라인' },
      ],
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('교육받은 교사 공통정보 저장 왕복', () => {
  it('일정 공통 라벨은 행에 들어가고 B 이후에도 공고·KPI가 남는다', () => {
    const existing = baseProgram()
    const curriculumSessions = stampTrainedTeachersSessionFields(
      existing.generalCommonInfo?.curriculumSessions,
      {
        educationFormScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        educationFormLabel: '오프라인',
        ipsTypeSummary: '일정 공통 | Inspire | 학교',
      }
    )
    const program: Program = {
      ...existing,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        educationFormLabel: '오프라인',
        educationFormScheduleDetail: 'common',
        ipsTypeSummary: '일정 공통 | Inspire | 학교',
        curriculumSessions,
      },
    }
    const programsRequest = mapTrainedTeacherToUpdateRequest(existing, {
      generalCommonInfo: program.generalCommonInfo,
    })
    const infoRequest = mapTrainedTeacherInfoSaveToRequest({
      educatedTeachers: 0,
      commonInfo: program.generalCommonInfo!,
    })

    const programsDetail = JSON.parse(programsRequest.serviceDetailJson ?? '{}') as {
      program?: {
        generalCommonInfo?: {
          announcementTitle?: string
          curriculumSessions?: Array<{ educationFormLabel?: string; ipsTypeSummary?: string }>
          participantRecruitmentInfo?: { inquiryTel?: string }
          kpi?: { finalParticipants?: number }
        }
      }
    }
    expect(programsDetail.program?.generalCommonInfo?.announcementTitle).toBe('기존 공고')
    expect(programsDetail.program?.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel).toBe(
      '02-000-0000'
    )
    expect(programsDetail.program?.generalCommonInfo?.kpi?.finalParticipants).toBe(30)
    expect(programsDetail.program?.generalCommonInfo?.curriculumSessions).toEqual([
      expect.objectContaining({
        educationFormLabel: '오프라인',
        ipsTypeSummary: '일정 공통 | Inspire | 학교',
      }),
      expect.objectContaining({
        educationFormLabel: '오프라인',
        ipsTypeSummary: '일정 공통 | Inspire | 학교',
      }),
    ])
    expect(infoRequest.configJson).not.toContain('announcementTitle')
    expect(infoRequest.configJson).not.toContain('finalParticipants')

    const loaded = mapTrainedTeacherDetailToProgram({
      id: existing.id,
      title: existing.title,
      totalParticipants: 30,
      serviceDetailJson: programsRequest.serviceDetailJson,
    } as ProgramResponse)
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(loaded, {
      teacherTrainingEnabled: true,
      educationJournalEnabled: true,
      configJson: infoRequest.configJson,
    })
    expect(merged.generalCommonInfo?.announcementTitle).toBe('기존 공고')
    expect(merged.generalCommonInfo?.kpi?.finalParticipants).toBe(30)
    expect(merged.generalCommonInfo?.kpi?.finalSchools).toBe(4)
    expect(merged.generalCommonInfo?.educationJournalEnabled).toBe(true)
    expect(merged.generalCommonInfo?.curriculumSessions?.[0]?.educationFormLabel).toBe('오프라인')
    expect(merged.generalCommonInfo?.curriculumSessions?.[1]?.ipsTypeSummary).toBe(
      '일정 공통 | Inspire | 학교'
    )
  })

  it('일정별 상이 교육 형태는 행 값을 유지한 채 A에 실린다', () => {
    const existing = baseProgram()
    const curriculumSessions = stampTrainedTeachersSessionFields(
      existing.generalCommonInfo?.curriculumSessions,
      {
        educationFormScheduleDetail: 'perSchedule',
        ipsScheduleDetail: 'perSchedule',
        educationFormLabel: '오프라인',
        ipsTypeSummary: '일정 공통 | Inspire | 학교',
      }
    )
    const request = mapTrainedTeacherToUpdateRequest(existing, {
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        educationFormScheduleDetail: 'perSchedule',
        curriculumSessions,
      },
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: {
        generalCommonInfo?: {
          curriculumSessions?: Array<{ educationFormLabel?: string }>
        }
      }
    }
    expect(detail.program?.generalCommonInfo?.curriculumSessions?.[0]?.educationFormLabel).toBe(
      '오프라인'
    )
    expect(detail.program?.generalCommonInfo?.curriculumSessions?.[1]?.educationFormLabel).toBe(
      '온라인'
    )
  })

  it('설문 keys·overlay가 serialize → parse 왕복에서 유지된다', () => {
    const existing = baseProgram()
    const withSurvey: Program = {
      ...existing,
      generalSurveyMenuKeys: ['survey', 'lecture_evaluation'],
      registrationOverlay: {
        'trainedTeachersRegistration.basicInfo.surveyItems': {
          survey: true,
          satisfaction: false,
          lecture_evaluation: true,
        },
      },
    }
    const json = serializeTrainedTeacherServiceDetailJson(withSurvey)
    const parsed = parseTrainedTeacherServiceDetailJson(json)
    expect(parsed.generalSurveyMenuKeys).toEqual(['survey', 'lecture_evaluation'])
    expect(
      (
        parsed.registrationOverlay?.[
          'trainedTeachersRegistration.basicInfo.surveyItems'
        ] as Record<string, boolean>
      )?.survey
    ).toBe(true)
    expect(
      (
        parsed.registrationOverlay?.[
          'trainedTeachersRegistration.basicInfo.surveyItems'
        ] as Record<string, boolean>
      )?.lecture_evaluation
    ).toBe(true)

    const loaded = mapTrainedTeacherDetailToProgram({
      id: existing.id,
      title: existing.title,
      serviceDetailJson: json,
    } as ProgramResponse)
    expect(loaded.generalSurveyMenuKeys).toEqual(['survey', 'lecture_evaluation'])
  })

  it('program.generalSurveyMenuKeys가 없어도 overlay surveyItems에서 복원한다', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      program: {
        generalCommonInfo: { announcementTitle: '공고' },
      },
      registration: {
        overlay: {
          'trainedTeachersRegistration.basicInfo.surveyItems': {
            survey: true,
            satisfaction: false,
            lecture_evaluation: true,
          },
        },
      },
    })
    const parsed = parseTrainedTeacherServiceDetailJson(raw)
    expect(parsed.generalSurveyMenuKeys).toEqual(['survey', 'lecture_evaluation'])
    expect(
      (
        parsed.registrationOverlay?.[
          'trainedTeachersRegistration.basicInfo.surveyItems'
        ] as Record<string, boolean>
      )?.survey
    ).toBe(true)
  })

  it('컬럼이 비어 있어도 nested educationProcess·partnerInvolvement를 hydrate한다', () => {
    const existing = baseProgram()
    const withEducation: Program = {
      ...existing,
      educationProcess: 'Digital (Computer)',
      partnerInvolvement: true,
      ipOwned: 'JA',
      courseDeliveredBy: 'JA',
    }
    const request = mapTrainedTeacherToUpdateRequest(withEducation)
    const loaded = mapTrainedTeacherDetailToProgram({
      id: existing.id,
      title: existing.title,
      // 컬럼 echo 누락 — nested JSON만 있는 경우
      educationProcess: null,
      partnerInvolvement: null,
      ipOwned: null,
      courseDeliveredBy: null,
      serviceDetailJson: request.serviceDetailJson,
    } as unknown as ProgramResponse)
    expect(loaded.educationProcess).toBe('Digital (Computer)')
    expect(loaded.partnerInvolvement).toBe(true)
    expect(loaded.ipOwned).toBe('JA')
    expect(loaded.courseDeliveredBy).toBe('JA')
  })

  it('overlay-only 설문을 폼 시드가 체크 상태로 채운다', () => {
    const values = programToDetailEditValues({
      ...baseProgram(),
      generalSurveyMenuKeys: undefined,
      registrationOverlay: {
        'trainedTeachersRegistration.basicInfo.surveyItems': {
          survey: true,
          satisfaction: false,
          lecture_evaluation: true,
        },
      },
    })
    expect(values.surveySurvey).toBe(true)
    expect(values.surveySatisfaction).toBe(false)
    expect(values.surveyLectureEvaluation).toBe(true)
  })
})
