import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherToUpdateRequest,
} from '@/features/program/trained-teachers/api/adapters'
import {
  mapTrainedTeacherInfoSaveToRequest,
  mergeTrainedTeacherInfoDetailIntoProgram,
} from '@/features/program/trained-teachers/api/info-detail-adapters'
import { parseTrainedTeacherServiceDetailJson } from '@/features/program/trained-teachers/api/service-detail-json'
import { buildTrainedTeachersCommonInfoSaveSlices } from '@/features/program/trained-teachers/lib/common-info-persist'

function ttProgram(patch: Partial<Program> = {}): Program {
  const now = '2026-03-01T00:00:00.000Z'
  return {
    id: '91011',
    sponsorId: '163001',
    title: '기존 공고',
    mainTitle: '기존 대표',
    titleEn: 'Existing Title',
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
    generalSurveyMenuKeys: ['survey', 'satisfaction'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      participantRecruitmentInfo: {
        announcementPublished: true,
        inquiryTel: '02-000-0000',
        remarks: '모집 비고',
        maxClassCount: 4,
        contactOrganizationName: '문의기관',
        unknownLegacyField: 'keep-recruit-sidecar',
      } as NonNullable<Program['generalCommonInfo']>['participantRecruitmentInfo'],
      kpi: {
        finalParticipants: 30,
        instructorCount: 0,
        volunteerCount: 0,
        finalSchools: 2,
        finalClasses: 3,
      },
      teacherTrainingEnabled: false,
      educationJournalEnabled: true,
      curriculumSessions: [
        { sessionLabel: '1회차', title: '1회차 제목', description: '내용1' },
        { sessionLabel: '2회차', title: '2회차 제목', description: '내용2' },
      ],
      scheduleDetails: [
        {
          scheduleLabel: '사전 교육',
          name: '사전교육',
          blockKind: 'preEducation',
        },
        {
          scheduleLabel: '세부 일정 01',
          name: '본일정',
          blockKind: 'event',
        },
      ],
    },
    registrationOverlay: {
      'application.institution.teacherTel': '02-111-1111',
      unknownSidecarKey: 'preserve-me',
    },
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

function parseA(program: Program, patch?: Partial<Program>) {
  const request = mapTrainedTeacherToUpdateRequest(program, patch)
  return {
    request,
    envelope: JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalSurveyMenuKeys?: string[]
      program?: {
        generalCommonInfo?: Record<string, unknown>
        generalSurveyMenuKeys?: string[]
      }
      registration?: { overlay?: Record<string, unknown> }
    },
  }
}

describe('TRAINED_TEACHER A/B PATCH ownership', () => {
  it('A PATCH 는 B 소유 nested·연수·일지를 보내지 않고 모집정보를 유지한다', () => {
    const { envelope } = parseA(ttProgram(), { mainTitle: '새 대표' })
    const common = envelope.program?.generalCommonInfo ?? {}
    expect(common.curriculumSessions).toBeUndefined()
    expect(common.scheduleDetails).toBeUndefined()
    expect(common.teacherTrainingEnabled).toBeUndefined()
    expect(common.educationJournalEnabled).toBeUndefined()
    expect(common.participantRecruitmentInfo).toMatchObject({
      inquiryTel: '02-000-0000',
      remarks: '모집 비고',
      maxClassCount: 4,
      unknownLegacyField: 'keep-recruit-sidecar',
    })
  })

  it('불완전한 participantRecruitmentInfo patch 를 GET 값과 합쳐 객체 교체에 대비한다', () => {
    const { envelope } = parseA(ttProgram(), {
      generalCommonInfo: {
        participantRecruitmentInfo: { inquiryTel: '02-999-8888' },
      },
    })
    expect(envelope.program?.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      inquiryTel: '02-999-8888',
      remarks: '모집 비고',
      maxClassCount: 4,
      contactOrganizationName: '문의기관',
      unknownLegacyField: 'keep-recruit-sidecar',
    })
  })

  it('B PATCH 는 모집정보·공고·KPI 를 넣지 않는다', () => {
    const program = ttProgram()
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      curriculumSessions: program.generalCommonInfo?.curriculumSessions,
      scheduleDetails: program.generalCommonInfo?.scheduleDetails,
    })
    const b = mapTrainedTeacherInfoSaveToRequest({ commonInfo: slices.infoDetailCommonInfo })
    expect(b.teacherTrainingEnabled).toBe(true)
    expect(b.educationJournalEnabled).toBe(false)
    expect(b.configJson).not.toContain('participantRecruitmentInfo')
    expect(b.configJson).not.toContain('모집 비고')
    expect(b.configJson).not.toContain('announcementTitle')
    expect(b.configJson).not.toContain('finalParticipants')
    expect(b.configJson).toContain('"sessionLabel":"1회차"')
    expect(b.configJson).toContain('"scheduleDetails":[]')
  })

  it('일정형 B PATCH 는 회차 배열과 일정 blockKind 를 섞지 않는다', () => {
    const program = ttProgram()
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'schedule',
      teacherTrainingEnabled: false,
      educationJournalEnabled: true,
      curriculumSessions: program.generalCommonInfo?.curriculumSessions,
      scheduleDetails: program.generalCommonInfo?.scheduleDetails,
    })
    const b = mapTrainedTeacherInfoSaveToRequest({ commonInfo: slices.infoDetailCommonInfo })
    expect(b.configJson).toContain('"curriculumSessions":[]')
    expect(b.configJson).toContain('"blockKind":"preEducation"')
    expect(b.configJson).toContain('"blockKind":"event"')
    expect(b.configJson).not.toContain('"sessionLabel":"1회차"')
  })

  it('A 다음 B 순서로 저장해도 모집정보와 커리큘럼이 각각 유지된다', () => {
    const existing = ttProgram()
    const { request: aRequest } = parseA(existing, { mainTitle: 'A 이후 대표' })
    const afterA = {
      ...existing,
      ...parseTrainedTeacherServiceDetailJson(aRequest.serviceDetailJson),
      mainTitle: aRequest.mainTitle,
    }
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      educationJournalEnabled: true,
      curriculumSessions: existing.generalCommonInfo?.curriculumSessions,
      scheduleDetails: existing.generalCommonInfo?.scheduleDetails,
    })
    const b = mapTrainedTeacherInfoSaveToRequest({ commonInfo: slices.infoDetailCommonInfo })
    const afterB = mergeTrainedTeacherInfoDetailIntoProgram(afterA, {
      teacherTrainingEnabled: b.teacherTrainingEnabled,
      educationJournalEnabled: b.educationJournalEnabled,
      configJson: b.configJson,
    })
    expect(afterB.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      remarks: '모집 비고',
      inquiryTel: '02-000-0000',
    })
    expect(afterB.generalCommonInfo?.teacherTrainingEnabled).toBe(true)
    expect(afterB.generalCommonInfo?.curriculumSessions).toHaveLength(2)
    expect(afterB.generalCommonInfo?.scheduleDetails).toEqual([])
  })

  it('B 다음 A 순서로 저장해도 연수·일지 nested 가 A 에 실리지 않는다', () => {
    const existing = ttProgram()
    const slices = buildTrainedTeachersCommonInfoSaveSlices({
      educationStructure: 'curriculum',
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      curriculumSessions: [
        { sessionLabel: '1회차', title: '수정 회차', description: '내용1' },
      ],
      scheduleDetails: [],
    })
    const b = mapTrainedTeacherInfoSaveToRequest({ commonInfo: slices.infoDetailCommonInfo })
    const afterB = mergeTrainedTeacherInfoDetailIntoProgram(existing, {
      teacherTrainingEnabled: b.teacherTrainingEnabled,
      educationJournalEnabled: b.educationJournalEnabled,
      configJson: b.configJson,
    })
    const { envelope } = parseA(afterB, { title: 'B 이후 공고' })
    expect(envelope.program?.generalCommonInfo?.curriculumSessions).toBeUndefined()
    expect(envelope.program?.generalCommonInfo?.teacherTrainingEnabled).toBeUndefined()
    expect(afterB.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('수정 회차')
    expect(afterB.generalCommonInfo?.teacherTrainingEnabled).toBe(true)
  })

  it('A 성공 후 B 실패를 가정하면 A 소유 모집정보는 남고 B 플래그는 이전 값이다', () => {
    const existing = ttProgram()
    const { request } = parseA(existing, { mainTitle: 'A만 성공' })
    const afterA = {
      ...existing,
      mainTitle: request.mainTitle,
      ...parseTrainedTeacherServiceDetailJson(request.serviceDetailJson),
    }
    expect(afterA.mainTitle).toBe('A만 성공')
    expect(afterA.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('모집 비고')
    expect(existing.generalCommonInfo?.teacherTrainingEnabled).toBe(false)
  })

  it('중간 GET 없이 stale 객체를 부분 재전송해도 GET 모집정보를 합친다', () => {
    const existing = ttProgram()
    const stalePatch: Partial<Program> = {
      generalCommonInfo: {
        participantRecruitmentInfo: { inquiryTel: '02-111-2222' },
      },
    }
    const { envelope } = parseA(existing, stalePatch)
    expect(envelope.program?.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      inquiryTel: '02-111-2222',
      remarks: '모집 비고',
      maxClassCount: 4,
    })
  })

  it('설문 [] 는 명시적 해제로 전송하고 overlay sidecar 는 남긴다', () => {
    const { envelope } = parseA(ttProgram({ generalSurveyMenuKeys: [] }))
    expect(envelope.generalSurveyMenuKeys).toEqual([])
    expect(envelope.registration?.overlay?.unknownSidecarKey).toBe('preserve-me')
    expect(envelope.registration?.overlay?.['application.institution.teacherTel']).toBe(
      '02-111-1111'
    )
  })

  it('legacy overlay GET sidecar 는 A PATCH registration.overlay 에 남는다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '91011',
      title: '레거시 공고명',
      mainTitle: '레거시 대표명',
      programType: 'TRAINED_TEACHER',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: { generalCommonInfo: { announcementTitle: '레거시 공고명' } },
        registration: {
          overlay: {
            unknownSidecarKey: 'preserve-me',
            'application.institution.teacherTel': '02-111-1111',
          },
        },
      }),
    } as Parameters<typeof mapTrainedTeacherDetailToProgram>[0])
    expect(mapped.registrationOverlay?.unknownSidecarKey).toBe('preserve-me')
    const { envelope } = parseA(mapped, { mainTitle: 'TT-05 레거시 이후 대표' })
    expect(envelope.registration?.overlay?.unknownSidecarKey).toBe('preserve-me')
    expect(envelope.registration?.overlay?.['application.institution.teacherTel']).toBe(
      '02-111-1111'
    )
  })

  it('설문을 생략하면 keys 를 보내지 않아 기존 선택을 유지하는 계약을 따른다', () => {
    const program = ttProgram()
    const withoutKeys = { ...program }
    delete withoutKeys.generalSurveyMenuKeys
    const { envelope } = parseA(withoutKeys)
    expect(envelope.generalSurveyMenuKeys).toBeUndefined()
  })
})
