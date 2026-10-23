import { describe, expect, it, vi } from 'vitest'
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import {
  applySavedRecruitmentOntoProgram,
  buildProgramRecruitmentRowSaveRequest,
  canSaveRecruitmentAsRowPatch,
  omitRecruitmentTabScheduleFields,
  persistRecruitmentTabSave,
} from './persist-recruitment-row-save'

vi.mock('@/features/program/shared/api/program-recruitment-rows', () => ({
  patchProgramRecruitment: vi.fn(async () => ({ id: 186605 })),
}))

function volunteerRow(overrides: Partial<ProgramRecruitmentWindow> = {}): ProgramRecruitmentWindow {
  return {
    id: 186605,
    recruitmentType: 'VOLUNTEER',
    applicationType: 'VOLUNTEER',
    targetType: 'COLLEGE_STUDENT',
    startAt: '2026-10-01T15:00:00.000Z',
    endAt: '2026-10-20T14:59:59.999Z',
    operationStartDate: '2026-11-18',
    operationEndDate: '2026-12-31',
    recruitTerm: null,
    ...overrides,
  }
}

function orgProgram(): Program {
  return {
    id: '186251',
    title: '기관 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_volunteers',
    backendProgramType: 'GENERAL_ORGANIZATION',
    rounds: [],
    startDate: '2026-11-18',
    endDate: '2026-12-31',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    programRecruitments: [
      {
        id: 186603,
        recruitmentType: 'PARTICIPANT',
        applicationType: 'ORGANIZATION',
        startAt: '2026-10-17',
        endAt: '2026-11-22',
      },
      {
        id: 186604,
        recruitmentType: 'INSTRUCTOR',
        applicationType: 'INSTRUCTOR',
        startAt: '2026-10-16T15:00:00.000Z',
        endAt: '2026-11-22T14:59:59.999Z',
      },
      volunteerRow(),
    ],
  }
}

describe('persist-recruitment-row-save', () => {
  it('봉사자 기간만 행 단건 바디로 만들고 recruitTerm·rounds는 넣지 않는다', () => {
    const program = orgProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: {
        volunteerApplicationStartDate: '2026-10-13T15:00:00.000Z',
        volunteerApplicationEndDate: '2026-10-31T14:59:59.999Z',
        rounds: program.rounds,
      },
      audience: 'volunteer',
    })
    expect(body).toMatchObject({
      id: 186605,
      applicationType: 'VOLUNTEER',
      recruitmentType: 'VOLUNTEER',
      targetType: 'COLLEGE_STUDENT',
      startAt: '2026-10-13T15:00:00.000Z',
      endAt: '2026-10-31T14:59:59.999Z',
    })
    expect(body?.recruitTerm).toBeUndefined()
    expect(body).not.toHaveProperty('rounds')
  })

  it('UJAT 봉사자는 해당 반기 행 id와 recruitTerm을 쓴다', () => {
    const program: Program = {
      ...orgProgram(),
      id: '180001',
      backendProgramType: 'UJAT',
      programRecruitments: [
        volunteerRow({
          id: 11,
          recruitTerm: 'FIRST_HALF',
          startAt: '2026-03-01T00:00:00.000Z',
        }),
        volunteerRow({
          id: 12,
          recruitTerm: 'SECOND_HALF',
          startAt: '2026-09-01T00:00:00.000Z',
        }),
      ],
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: {
        volunteerApplicationStartDate: '2026-09-10T00:00:00.000Z',
        volunteerApplicationEndDate: '2026-09-30T00:00:00.000Z',
      },
      audience: 'volunteer',
      volunteerHalf: 'h2',
    })
    expect(body?.id).toBe(12)
    expect(body?.recruitTerm).toBe('SECOND_HALF')
    expect(body?.startAt).toBe('2026-09-10T00:00:00.000Z')
  })

  it("빈 row 값은 유지(null)가 아니라 비움('')으로 PATCH한다", () => {
    const program: Program = {
      ...orgProgram(),
      backendProgramType: 'UJAT',
      programRecruitments: [
        volunteerRow({
          recruitTerm: 'FIRST_HALF',
          announcementTitle: null,
          programDescription: null,
          recruitmentGuide: null,
          applicationMethod: null,
          remarks: null,
          contactName: null,
          interviewStartAt: null,
        }),
      ],
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: {
        volunteerApplicationStartDate: '',
        interviewStartDate: '',
      },
      audience: 'volunteer',
      volunteerHalf: 'h1',
    })
    expect(body).toMatchObject({
      announcementTitle: '',
      programDescription: '',
      recruitmentGuide: '',
      applicationMethod: '',
      remarks: '',
      contactName: '',
      interviewStartAt: '',
    })
    expect(body?.clearFields).toContain('startAt')
  })

  it('모집 탭 fallback patch에서 rounds를 제거한다', () => {
    const next = omitRecruitmentTabScheduleFields({
      volunteerApplicationEndDate: '2026-10-31',
      rounds: [{ roundNumber: 1, startDate: '2026-11-02' } as Program['rounds'][number]],
    })
    expect(next.rounds).toBeUndefined()
    expect(next.volunteerApplicationEndDate).toBe('2026-10-31')
  })

  it('교육받은 교사·1사1교는 행 PATCH를 쓰지 않는다', () => {
    expect(
      canSaveRecruitmentAsRowPatch({
        ...orgProgram(),
        id: '186001',
        backendProgramType: 'TRAINED_TEACHER',
      })
    ).toBe(false)
  })

  it('행 id가 있으면 단건 PATCH 후 재조회하고, 재조회가 빼먹은 기간은 저장값으로 맞춘다', async () => {
    const program = orgProgram()
    const refetched = { ...program, title: 'refetched' }
    const result = await persistRecruitmentTabSave({
      baseline: program,
      draft: program,
      patch: {
        volunteerApplicationEndDate: '2026-10-31T14:59:59.999Z',
        rounds: program.rounds,
      },
      audience: 'volunteer',
      refetchProgram: async () => refetched,
    })
    expect(result.mode).toBe('row')
    if (result.mode !== 'row') return
    expect(result.program.title).toBe('refetched')
    expect(result.program.volunteerApplicationEndDate).toBe('2026-10-31T14:59:59.999Z')
    expect(
      result.program.programRecruitments?.find(row => row.recruitmentType === 'VOLUNTEER')?.endAt
    ).toBe('2026-10-31T14:59:59.999Z')
  })

  it('원격 SSOT 모드에서는 재조회 API 응답을 draft·patch·행 응답으로 덮지 않는다', async () => {
    const program = orgProgram()
    const refetched: Program = {
      ...program,
      title: 'remote response',
      registrationOverlay: { 'remote.key': 'server' },
      generalCommonInfo: {
        participantRecruitmentInfo: { recruitmentTarget: '서버 기준' },
      },
    }
    const result = await persistRecruitmentTabSave({
      baseline: program,
      draft: program,
      patch: {
        title: 'local draft',
        registrationOverlay: { 'local.key': 'stale' },
        generalCommonInfo: {
          participantRecruitmentInfo: { recruitmentTarget: '로컬 기준' },
        },
      },
      audience: 'participant',
      refetchProgram: async () => refetched,
      remoteResponsePriority: true,
    })
    expect(result.mode).toBe('row')
    if (result.mode !== 'row') return
    expect(result.program).toBe(refetched)
    expect(result.program.title).toBe('remote response')
    expect(result.program.registrationOverlay).toEqual({ 'remote.key': 'server' })
    expect(result.program.generalCommonInfo?.participantRecruitmentInfo?.recruitmentTarget).toBe(
      '서버 기준'
    )
  })

  it('재조회 nested가 옛값이면 저장한 봉사자 모집 정보를 화면에 남긴다', () => {
    const program = orgProgram()
    const fetched = {
      ...program,
      generalCommonInfo: {
        volunteerRecruitmentInfo: {
          recruitmentTarget: '대학생',
          remarks: '수정 전 비고',
          contactOrganizationName: '옛 문의처',
        },
      },
    }
    const next = applySavedRecruitmentOntoProgram({
      fetched,
      draft: program,
      patch: {
        volunteerApplicationStartDate: '2026-11-01T00:00:00.000Z',
        volunteerTargets: ['university'],
        volunteerTarget: '대학(원)생',
        generalCommonInfo: {
          volunteerRecruitmentInfo: {
            recruitmentTarget: '대학(원)생',
            remarks: '수정된 비고',
            contactOrganizationName: '새 문의처',
          },
        },
        programRecruitments: program.programRecruitments?.map(row =>
          row.recruitmentType === 'VOLUNTEER' ? { ...row, contactName: '새 문의처' } : row
        ),
      },
      audience: 'volunteer',
      row: {
        id: 186605,
        contactName: '새 문의처',
        startAt: '2026-11-01T00:00:00.000Z',
      },
    })
    expect(next.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentTarget).toBe('대학(원)생')
    expect(next.generalCommonInfo?.volunteerRecruitmentInfo?.remarks).toBe('수정된 비고')
    expect(next.volunteerTarget).toBe('대학(원)생')
    const volunteer = next.programRecruitments?.find(row => row.id === 186605)
    expect(volunteer?.contactName).toBe('새 문의처')
    expect(volunteer?.startAt).toBe('2026-11-01T00:00:00.000Z')
    expect(
      next.programRecruitments?.find(row => row.recruitmentType === 'INSTRUCTOR')?.startAt
    ).toBe('2026-10-16T15:00:00.000Z')
  })

  it('재조회 nested가 옛값이면 저장한 참여자·참여 기관 모집 정보를 화면에 남긴다', () => {
    const program = orgProgram()
    const next = applySavedRecruitmentOntoProgram({
      fetched: {
        ...program,
        resultAnnouncementDate: '2026-09-01T00:00:00.000Z',
        resultAnnouncementMethod: '기존 게시',
        generalCommonInfo: {
          participantRecruitmentInfo: {
            recruitmentTarget: '중학생',
            remarks: '수정 전 비고',
          },
        },
      },
      draft: program,
      patch: {
        applicationEndDate: '2026-11-30T14:59:59.999Z',
        resultAnnouncementDate: '2026-12-01T00:00:00.000Z',
        resultAnnouncementMethod: '홈페이지',
        generalParticipantInterviewEnabled: false,
        generalCommonInfo: {
          participantRecruitmentInfo: {
            recruitmentTarget: '고등학생',
            remarks: '수정된 비고',
            finalAnnouncementLabel: '2026.12.01. | 홈페이지',
          },
        },
      },
      audience: 'participant',
    })
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.recruitmentTarget).toBe('고등학생')
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('수정된 비고')
    expect(next.resultAnnouncementDate).toBe('2026-12-01T00:00:00.000Z')
    expect(next.resultAnnouncementMethod).toBe('홈페이지')
    expect(next.generalParticipantInterviewEnabled).toBe(false)
    expect(
      next.programRecruitments?.find(row => row.recruitmentType === 'PARTICIPANT')?.endAt
    ).toBe('2026-11-30T14:59:59.999Z')
  })

  it('재조회 nested가 옛값이면 저장한 강사 모집 정보를 화면에 남긴다', () => {
    const program = orgProgram()
    const next = applySavedRecruitmentOntoProgram({
      fetched: {
        ...program,
        finalPassAnnouncementDate: '2026-09-01T00:00:00.000Z',
        generalCommonInfo: {
          instructorRecruitmentInfo: {
            recruitmentTarget: '기존 강사',
            remarks: '수정 전 비고',
          },
        },
      },
      draft: program,
      patch: {
        instructorApplicationEndDate: '2026-11-30T14:59:59.999Z',
        finalPassAnnouncementDate: '2026-12-02T00:00:00.000Z',
        finalPassAnnouncementMethod: '문자',
        generalCommonInfo: {
          instructorRecruitmentInfo: {
            recruitmentTarget: '현직 강사',
            remarks: '수정된 비고',
            finalAnnouncementLabel: '2026.12.02. | 문자',
          },
        },
      },
      audience: 'instructor',
    })
    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentTarget).toBe('현직 강사')
    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.remarks).toBe('수정된 비고')
    expect(next.finalPassAnnouncementDate).toBe('2026-12-02T00:00:00.000Z')
    expect(next.finalPassAnnouncementMethod).toBe('문자')
    expect(next.programRecruitments?.find(row => row.recruitmentType === 'INSTRUCTOR')?.endAt).toBe(
      '2026-11-30T14:59:59.999Z'
    )
  })
})
