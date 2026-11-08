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

  it('기관 최종 발표 방법을 비우면 빈 문자열로 보낸다', () => {
    const program = orgProgram()
    const draft: Program = {
      ...program,
      programRecruitments: program.programRecruitments?.map(row =>
        row.recruitmentType === 'PARTICIPANT'
          ? { ...row, finalPassAnnouncementMethod: '홈페이지 공지' }
          : row
      ),
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: draft,
      draft,
      patch: {
        resultAnnouncementMethod: '',
      },
      audience: 'participant',
    })
    expect(body?.finalPassAnnouncementMethod).toBe('')
  })

  it('H1 extra만 보내면 H2 행은 요청에 넣지 않는다', () => {
    const program: Program = {
      ...orgProgram(),
      backendProgramType: 'UJAT',
      programRecruitments: [
        volunteerRow({
          id: 1001,
          recruitTerm: 'FIRST_HALF',
          documentPassAnnouncementMethod: '홈페이지 공지',
          volunteerTargetDetail: '대학생 상반기',
        }),
        volunteerRow({
          id: 1002,
          recruitTerm: 'SECOND_HALF',
          documentPassAnnouncementMethod: '문자 안내',
          volunteerTargetDetail: '하반기 상세',
        }),
      ],
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: {
        documentPassAnnouncementMethod: '이메일 안내',
        volunteerTargetDetail: '상반기 상세만',
      },
      audience: 'volunteer',
      volunteerHalf: 'h1',
    })
    expect(body?.id).toBe(1001)
    expect(body?.recruitTerm).toBe('FIRST_HALF')
    expect(body?.documentPassAnnouncementMethod).toBe('이메일 안내')
    expect(body?.volunteerTargetDetail).toBe('상반기 상세만')
  })

  it('기관 행 비고만 바꾸면 remarks만 보내고 빈 announcementTitle·summary를 넣지 않는다', () => {
    const program: Program = {
      ...orgProgram(),
      programRecruitments: orgProgram().programRecruitments?.map(row =>
        row.recruitmentType === 'PARTICIPANT'
          ? {
              ...row,
              remarks: '기존 기관 비고',
              announcementTitle: null,
              summary: null,
              contentRevision: 3,
            }
          : row
      ),
    }
    const draft: Program = {
      ...program,
      programRecruitments: program.programRecruitments?.map(row =>
        row.recruitmentType === 'PARTICIPANT' ? { ...row, remarks: 'G02 BOT-TEST 기관 비고' } : row
      ),
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft,
      patch: {
        generalCommonInfo: {
          participantRecruitmentInfo: { remarks: 'G02 BOT-TEST 기관 비고' },
        },
        programRecruitments: draft.programRecruitments,
      },
      audience: 'participant',
    })
    expect(body?.remarks).toBe('G02 BOT-TEST 기관 비고')
    expect(body?.expectedRevision).toBe(3)
    expect(body).not.toHaveProperty('announcementTitle')
    expect(body).not.toHaveProperty('summary')
    expect(body).not.toHaveProperty('otherMatters')
    expect(body?.clearFields ?? []).not.toContain('remarks')
  })

  it('기관 행 비고를 비우면 clearFields만 쓰고 본문에 빈 문자열을 넣지 않는다', () => {
    const program: Program = {
      ...orgProgram(),
      programRecruitments: orgProgram().programRecruitments?.map(row =>
        row.recruitmentType === 'PARTICIPANT' ? { ...row, remarks: '기존 기관 비고' } : row
      ),
    }
    const draft: Program = {
      ...program,
      programRecruitments: program.programRecruitments?.map(row =>
        row.recruitmentType === 'PARTICIPANT' ? { ...row, remarks: null } : row
      ),
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft,
      patch: {
        generalCommonInfo: { participantRecruitmentInfo: { remarks: undefined } },
        programRecruitments: draft.programRecruitments,
      },
      audience: 'participant',
    })
    expect(body?.remarks).toBeUndefined()
    expect(body?.clearFields).toEqual(expect.arrayContaining(['remarks']))
  })

  it('기관 행 비고가 같으면 remarks만 다시 보내고 revision을 유지한다', () => {
    const program: Program = {
      ...orgProgram(),
      programRecruitments: orgProgram().programRecruitments?.map(row =>
        row.recruitmentType === 'PARTICIPANT'
          ? { ...row, remarks: 'G02 BOT-TEST 기관 비고', contentRevision: 4 }
          : row
      ),
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: {
        generalCommonInfo: {
          participantRecruitmentInfo: { remarks: 'G02 BOT-TEST 기관 비고' },
        },
        programRecruitments: program.programRecruitments,
      },
      audience: 'participant',
    })
    expect(body?.remarks).toBe('G02 BOT-TEST 기관 비고')
    expect(body?.expectedRevision).toBe(4)
    expect(body?.clearFields ?? []).not.toContain('remarks')
  })

  it('재조회 행 remarks가 옛값이면 저장 응답 remarks·contentRevision을 화면에 남긴다', () => {
    const program = orgProgram()
    const next = applySavedRecruitmentOntoProgram({
      fetched: {
        ...program,
        programRecruitments: program.programRecruitments?.map(row =>
          row.recruitmentType === 'PARTICIPANT'
            ? { ...row, remarks: '수정 전 비고', contentRevision: 1 }
            : row
        ),
      },
      draft: program,
      patch: {
        generalCommonInfo: {
          participantRecruitmentInfo: { remarks: 'G02 BOT-TEST 기관 비고' },
        },
        programRecruitments: program.programRecruitments?.map(row =>
          row.recruitmentType === 'PARTICIPANT'
            ? { ...row, remarks: 'G02 BOT-TEST 기관 비고' }
            : row
        ),
      },
      audience: 'participant',
      row: {
        id: 186603,
        remarks: 'G02 BOT-TEST 기관 비고',
        contentRevision: 2,
      },
    })
    const participant = next.programRecruitments?.find(row => row.id === 186603)
    expect(participant?.remarks).toBe('G02 BOT-TEST 기관 비고')
    expect(participant?.contentRevision).toBe(2)
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe(
      'G02 BOT-TEST 기관 비고'
    )
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

  it('재조회 targetLevels가 옛 컬럼이어도 저장한 참여자 교육 대상을 남긴다', () => {
    const program = orgProgram()
    const next = applySavedRecruitmentOntoProgram({
      fetched: {
        ...program,
        targetLevels: ['high', 'university'],
        targetLevel: 'high',
      },
      draft: program,
      patch: {
        targetLevels: ['elementary', 'middle', 'high', 'university', 'adult'],
        targetLevel: 'elementary',
      },
      audience: 'participant',
    })
    expect(next.targetLevels).toEqual(['elementary', 'middle', 'high', 'university', 'adult'])
    expect(next.targetLevel).toBe('elementary')
  })

  it('강사 탭 저장은 참여자 targetLevels 컬럼을 폼 값으로 바꾸지 않는다', () => {
    const program = orgProgram()
    const next = applySavedRecruitmentOntoProgram({
      fetched: { ...program, targetLevels: ['high', 'university'], targetLevel: 'high' },
      draft: program,
      patch: { targetLevels: ['adult'], instructorTargets: ['adult'] },
      audience: 'instructor',
    })
    expect(next.targetLevels).toEqual(['high', 'university'])
    expect(next.instructorTargets).toEqual(['adult'])
  })

  it('봉사자 모집 대상을 폼에서 바꾸면 행 PATCH에 그 값을 넣는다', () => {
    const program = orgProgram()
    const row = program.programRecruitments?.find(item => item.recruitmentType === 'VOLUNTEER')
    const withTargets = {
      ...program,
      volunteerTargets: ['university'],
      programRecruitments: program.programRecruitments?.map(item =>
        item === row ? { ...item, volunteerTargets: ['university'] } : item
      ),
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: withTargets,
      draft: withTargets,
      patch: { volunteerTargets: ['high', 'adult'] },
      audience: 'volunteer',
    })
    expect(body?.volunteerTargets).toEqual(['high', 'adult'])
  })

  it('봉사자 모집 대상이 그대로면 행에 있던 값을 유지한다', () => {
    const program = orgProgram()
    const withTargets = {
      ...program,
      volunteerTargets: ['university'],
      programRecruitments: program.programRecruitments?.map(item =>
        item.recruitmentType === 'VOLUNTEER' ? { ...item, volunteerTargets: ['university'] } : item
      ),
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: withTargets,
      draft: withTargets,
      patch: { volunteerTargets: ['university'] },
      audience: 'volunteer',
    })
    expect(body?.volunteerTargets).toEqual(['university'])
  })

  it('UJAT가 행에 기록한 봉사자 모집 대상은 폼 원문으로 바꾸지 않는다', () => {
    const program = orgProgram()
    const draft = {
      ...program,
      programRecruitments: program.programRecruitments?.map(item =>
        item.recruitmentType === 'VOLUNTEER'
          ? { ...item, volunteerTargets: ['university', 'adult'] }
          : item
      ),
    }
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft,
      patch: { volunteerTargets: ['대학생', '성인'] },
      audience: 'volunteer',
    })
    expect(body?.volunteerTargets).toEqual(['university', 'adult'])
  })

  it('참여자 최종 발표 수정은 모집 행 finalPassAnnouncementAt에 싣는다', () => {
    const program = orgProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: { resultAnnouncementDate: '2026-11-10T01:00:00.000Z' },
      audience: 'participant',
    })
    expect(body?.finalPassAnnouncementAt).toBe('2026-11-10T01:00:00.000Z')
  })

  it('참여자 서류 발표를 비우면 clearFields에 documentPassAnnouncementAt을 넣는다', () => {
    const program = orgProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: { documentPassAnnouncementDate: undefined },
      audience: 'participant',
    })
    expect(body?.clearFields).toContain('documentPassAnnouncementAt')
    expect(body?.documentPassAnnouncementAt).toBeUndefined()
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
