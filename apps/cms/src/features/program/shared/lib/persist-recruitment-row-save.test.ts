import { describe, expect, it, vi } from 'vitest'
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import {
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

  it('모집 탭 fallback patch에서 rounds를 제거한다', () => {
    const next = omitRecruitmentTabScheduleFields({
      volunteerApplicationEndDate: '2026-10-31',
      rounds: [{ roundNumber: 1, startDate: '2026-11-02' }],
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

  it('행 id가 있으면 단건 PATCH 후 재조회한다', async () => {
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
    expect(result).toEqual({ mode: 'row', program: refetched })
  })
})
