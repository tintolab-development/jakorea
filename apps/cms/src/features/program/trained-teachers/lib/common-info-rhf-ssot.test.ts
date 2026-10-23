import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  detailEditValuesToProgramPatch,
  programToDetailEditValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import {
  mapTrainedTeacherToUpdateRequest,
} from '@/features/program/trained-teachers/api/adapters'
import {
  mapTrainedTeacherInfoSaveToRequest,
  mergeTrainedTeacherInfoDetailIntoProgram,
} from '@/features/program/trained-teachers/api/info-detail-adapters'
import { serializeTrainedTeacherServiceDetailJson } from '@/features/program/trained-teachers/api/service-detail-json'
import {
  buildTrainedTeachersCommonInfoSaveSlices,
  omitTrainedTeacherStaleSessionOverlayKeys,
  resolveTrainedTeachersCanonicalCommonInfo,
} from './common-info-persist'

function staleOverlay(): Record<string, unknown> {
  return {
    'trainedTeachersRegistration.basicInfo.surveyItems': {
      survey: true,
      satisfaction: true,
      lecture_evaluation: true,
    },
    'trainedTeachersRegistration.basicInfo.detailedProgramId': '163010',
    'trainedTeachersRegistration.basicInfo.sponsorId': '1627251',
    'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': 'yes',
    'trainedTeachersRegistration.educationCurriculum.unitNameBySession': {
      1: '구1',
      2: '구2',
      3: '구3',
      4: '구4',
    },
    'trainedTeachersRegistration.educationScheduleSettings.scheduleLines': [
      '2026.11.06(금) 10:00 ~ 12:00',
    ],
    'application.institution.teacherTel': '02-111-1111',
  }
}

function getFixture(patch: Partial<Program> = {}): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: '186312',
    sponsorId: '1627253',
    title: '교교 수정테스트32323',
    mainTitle: 'ㅇㅇㅇㅇ222',
    titleEn: '232323',
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
    businessArea: '진로취업',
    educationProcess: 'Hybrid',
    ipOwned: 'Partner',
    courseDeliveredBy: 'Jointly',
    partnerInvolvement: true,
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalParticipantTypes: ['school_institution'],
    generalSurveyMenuKeys: ['survey'],
    generalCommonInfo: {
      announcementTitle: '교교 수정테스트32323',
      detailedProgramName: '세부 신값',
      sponsorManagementIds: ['1627253'],
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
      curriculumSessions: [
        {
          sessionLabel: '1회차',
          title: '1회차',
          description: '내용1',
          assignmentEnabled: false,
        },
        {
          sessionLabel: '2회차',
          title: '2회차',
          description: '내용2',
          assignmentEnabled: true,
          assignmentPeriod: '2026.10.31',
        },
      ],
      scheduleDetails: [],
      participantRecruitmentInfo: {
        inquiryTel: '02-000-0000',
        remarks: '모집 비고',
      },
    },
    registrationOverlay: staleOverlay(),
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

describe('교육받은 교사 공통정보 RHF SSOT', () => {
  it('1-2. legacy overlay GET 진입 시 canonical 으로 시드한다', () => {
    const program = getFixture()
    const canonical = resolveTrainedTeachersCanonicalCommonInfo(program)
    const values = programToDetailEditValues(program)

    expect(values.detailedProgramId).toBe('163009')
    expect(values.sponsorManagementIds).toEqual(['1627253'])
    expect(values.surveySurvey).toBe(true)
    expect(values.surveySatisfaction).toBe(false)
    expect(values.educationScheduleLines).toEqual(['2026.10.29 ~ 2026.10.31'])
    expect(values.teacherTrainingEnabled).toBe(true)
    expect(values.educationJournalEnabled).toBe(false)
    expect(canonical.curriculumSessions).toHaveLength(2)
    expect(canonical.teacherTrainingEnabled).toBe(true)
    expect(canonical.educationJournalEnabled).toBe(false)
  })

  it('3. 기본정보 수정 patch 가 RHF 와 일치한다', () => {
    const program = getFixture()
    const values = programToDetailEditValues(program)
    const next = {
      ...values,
      mainTitle: '대표 수정',
      titleEn: 'EN-EDIT',
      announcementTitle: '공고 수정',
      detailedProgramId: '163009',
    }
    const patch = detailEditValuesToProgramPatch(next, program)
    expect(patch.mainTitle).toBe('대표 수정')
    expect(patch.titleEn).toBe('EN-EDIT')
    expect(patch.title).toBe('공고 수정')
    expect(patch.detailedProgramId).toBe('163009')
    expect(patch.sponsorId).toBe('1627253')
  })

  it('4-5. 교육 연수·교육일지 true/false 왕복이 A·B payload 에 반영된다', () => {
    const on = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      educationJournalEnabled: true,
      curriculumSessions: [{ sessionLabel: '1회차', title: '1', description: '' }],
    })
    const off = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      curriculumSessions: [{ sessionLabel: '1회차', title: '1', description: '' }],
    })
    expect(mapTrainedTeacherInfoSaveToRequest({ commonInfo: on.infoDetailCommonInfo })).toMatchObject({
      teacherTrainingEnabled: true,
      educationJournalEnabled: true,
    })
    expect(mapTrainedTeacherInfoSaveToRequest({ commonInfo: off.infoDetailCommonInfo })).toMatchObject({
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
    })
    expect(on.extraCommonInfo.teacherTrainingEnabled).toBe(true)
    expect(off.extraCommonInfo.educationJournalEnabled).toBe(false)
  })

  it('6-7. 커리큘럼 추가·삭제·과제 변경이 stale overlay 로 복원되지 않는다', () => {
    const program = getFixture()
    const values = {
      ...programToDetailEditValues(program),
      trainedTeachersCurriculumSessions: [
        {
          sessionLabel: '1회차',
          title: '수정1',
          description: '본문',
          assignmentEnabled: false,
        },
      ],
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
    }
    const patch = detailEditValuesToProgramPatch(values, program)
    expect(patch.generalCommonInfo?.curriculumSessions).toEqual([
      {
        sessionLabel: '1회차',
        title: '수정1',
        description: '본문',
        assignmentEnabled: false,
      },
    ])
    const serialized = JSON.parse(
      serializeTrainedTeacherServiceDetailJson({
        ...program,
        ...patch,
        generalCommonInfo: {
          ...program.generalCommonInfo,
          ...patch.generalCommonInfo,
        },
      })
    ) as { registration?: { overlay?: Record<string, unknown> } }
    expect(
      serialized.registration?.overlay?.[
        'trainedTeachersRegistration.educationCurriculum.unitNameBySession'
      ]
    ).toBeUndefined()
  })

  it('8. 날짜 지정에서 기간 지정으로 바꾸면 이전 예정일을 병합하지 않는다', () => {
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      curriculumSessions: [{ sessionLabel: '1회차', title: '1', description: '' }],
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
    })
    expect(slices.extraCommonInfo.educationScheduleMode).toBe('period')
    expect(slices.extraCommonInfo.educationScheduleLines).toEqual(['2026.10.29 ~ 2026.10.31'])
    expect(slices.extraCommonInfo.educationScheduleLines).not.toContain(
      '2026.11.06(금) 10:00 ~ 12:00'
    )
  })

  it('9-10. 후원사·세부 프로그램 canonical ID 를 overlay 과거 ID 로 덮지 않고 교재명과 독립이다', () => {
    const program = getFixture({ textbookName: '교재명 유지' })
    const values = programToDetailEditValues(program)
    expect(values.detailedProgramId).toBe('163009')
    expect(values.sponsorManagementIds).toEqual(['1627253'])
    const patch = detailEditValuesToProgramPatch(
      { ...values, detailedProgramId: '163009' },
      program
    )
    const request = mapTrainedTeacherToUpdateRequest(program, patch)
    expect(request.detailedProgramId).toBe(163009)
    expect(request.sponsorId).toBe('1627253')
    expect(request.textbookName).toBe('교재명 유지')
    expect(omitTrainedTeacherStaleSessionOverlayKeys(program.registrationOverlay)).not.toHaveProperty(
      'trainedTeachersRegistration.basicInfo.detailedProgramId'
    )
  })

  it('11. 설문 진행 항목 변경 후 재시드가 overlay true 로 되살리지 않는다', () => {
    const program = getFixture({ generalSurveyMenuKeys: ['survey'] })
    const values = programToDetailEditValues(program)
    expect(values.surveySurvey).toBe(true)
    expect(values.surveySatisfaction).toBe(false)
    expect(values.surveyLectureEvaluation).toBe(false)
  })

  it('12. 저장 → GET merge → 재시드 값이 유지된다', () => {
    const existing = getFixture()
    const values = {
      ...programToDetailEditValues(existing),
      announcementTitle: '재저장 공고',
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      educationScheduleMode: 'period' as const,
      educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
      trainedTeachersCurriculumSessions: existing.generalCommonInfo?.curriculumSessions,
    }
    const patch = detailEditValuesToProgramPatch(values, existing)
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      curriculumSessions: existing.generalCommonInfo?.curriculumSessions,
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
    })
    const aRequest = mapTrainedTeacherToUpdateRequest(existing, {
      ...patch,
      generalCommonInfo: {
        ...patch.generalCommonInfo,
        ...slices.extraCommonInfo,
      },
    })
    const bRequest = mapTrainedTeacherInfoSaveToRequest({
      commonInfo: slices.infoDetailCommonInfo,
    })
    expect(bRequest.teacherTrainingEnabled).toBe(true)
    expect(bRequest.educationJournalEnabled).toBe(false)
    const aDetail = JSON.parse(aRequest.serviceDetailJson ?? '{}') as {
      program?: { generalCommonInfo?: { teacherTrainingEnabled?: boolean } }
    }
    expect(aDetail.program?.generalCommonInfo?.teacherTrainingEnabled).toBe(true)

    const merged = mergeTrainedTeacherInfoDetailIntoProgram(
      { ...existing, ...patch, generalCommonInfo: { ...existing.generalCommonInfo, ...patch.generalCommonInfo, ...slices.extraCommonInfo } },
      {
        teacherTrainingEnabled: true,
        educationJournalEnabled: false,
        configJson: bRequest.configJson,
      }
    )
    const reseed = programToDetailEditValues(merged)
    expect(reseed.teacherTrainingEnabled).toBe(true)
    expect(reseed.educationJournalEnabled).toBe(false)
    expect(reseed.educationScheduleLines).toEqual(['2026.10.29 ~ 2026.10.31'])
    expect(reseed.trainedTeachersCurriculumSessions).toHaveLength(2)
  })

  it('13. 모집정보·신청정보 overlay 키는 공통정보 persist 에서 제거하지 않는다', () => {
    expect(
      omitTrainedTeacherStaleSessionOverlayKeys({
        'application.institution.teacherTel': '02-111-1111',
        'trainedTeachersRegistration.basicInfo.sponsorId': '1627251',
      })
    ).toEqual({
      'application.institution.teacherTel': '02-111-1111',
    })
    const program = getFixture()
    const patch = detailEditValuesToProgramPatch(programToDetailEditValues(program), program)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel).toBe('02-000-0000')
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('모집 비고')
  })

  it('14. 등록 후 교육 구조·회차 유형 patch 는 기존 값을 유지한다', () => {
    const program = getFixture({
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
    })
    const values = {
      ...programToDetailEditValues(program),
      educationStructure: 'curriculum' as const,
      sessionRound: 'multi' as const,
    }
    const patch = detailEditValuesToProgramPatch(values, program)
    expect(patch.generalProgramEducationStructure).toBe('schedule')
    expect(patch.generalProgramSessionRound).toBe('single')
  })
})
