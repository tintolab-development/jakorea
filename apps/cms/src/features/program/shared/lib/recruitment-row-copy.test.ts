import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  applyRecruitmentRowCopy,
  resolveRecruitmentOtherMatters,
} from './recruitment-row-copy'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186021',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    sponsorId: 'sponsor-1',
    rounds: [],
    otherNotes: '프로그램 공통 기타',
    oneLineIntroduction: '한줄 소개',
    ...overrides,
  } as Program
}

describe('resolveRecruitmentOtherMatters', () => {
  it('봉사자 행 otherMatters를 비고·프로그램 공통보다 먼저 쓴다', () => {
    const program = baseProgram({
      generalCommonInfo: {
        volunteerRecruitmentInfo: { remarks: '봉사자 비고', otherMatters: 'nested 기타' },
      },
      programRecruitments: [
        {
          id: 186070,
          recruitmentType: 'VOLUNTEER',
          remarks: '행 비고',
          otherMatters: '행 기타사항',
        },
      ],
    })

    expect(resolveRecruitmentOtherMatters(program, 'volunteer')).toBe('행 기타사항')
  })

  it('행이 비면 nested otherMatters를 쓰고 비고는 쓰지 않는다', () => {
    const program = baseProgram({
      generalCommonInfo: {
        volunteerRecruitmentInfo: { remarks: '봉사자 비고', otherMatters: 'nested 기타' },
      },
      programRecruitments: [{ id: 186070, recruitmentType: 'VOLUNTEER', remarks: '행 비고' }],
    })

    expect(resolveRecruitmentOtherMatters(program, 'volunteer')).toBe('nested 기타')
  })
})

describe('applyRecruitmentRowCopy', () => {
  it('강사·봉사자 행 기타사항은 otherNotes로, 비고는 oneLineIntroduction으로 넣는다', () => {
    const program = baseProgram({
      otherNotes: '공통 기타',
      programRecruitments: [
        {
          id: 186070,
          recruitmentType: 'VOLUNTEER',
          programDescription: '봉사자 설명',
          remarks: '봉사자 비고',
          otherMatters: '봉사자 기타사항',
        },
      ],
    })

    const next = applyRecruitmentRowCopy(program, 'volunteer')
    expect(next.otherNotes).toBe('봉사자 기타사항')
    expect(next.oneLineIntroduction).toBe('봉사자 비고')
    expect(next.description).toBe('봉사자 설명')
  })

  it('행 otherMatters가 없으면 overlay otherNotes(비고)를 비고로 덮지 않는다', () => {
    const program = baseProgram({
      otherNotes: 'overlay 비고',
      programRecruitments: [
        { id: 1, recruitmentType: 'VOLUNTEER', remarks: '행 비고' },
      ],
    })

    const next = applyRecruitmentRowCopy(program, 'volunteer')
    expect(next.otherNotes).toBe('overlay 비고')
    expect(next.oneLineIntroduction).toBe('행 비고')
  })
})
