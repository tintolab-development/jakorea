import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { isGeneralRecruitmentRowProgram } from './is-general-recruitment-row-program'

function program(overrides: Partial<Program> = {}): Program {
  return {
    id: '186021',
    title: '일반',
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
    ...overrides,
  } as Program
}

describe('isGeneralRecruitmentRowProgram', () => {
  it('18xxxx 일반 프로그램 id는 모집 행 비고·기타사항을 쓴다', () => {
    expect(isGeneralRecruitmentRowProgram(program({ id: '186021' }))).toBe(true)
    expect(isGeneralRecruitmentRowProgram(program({ id: '186069' }))).toBe(true)
  })

  it('UJAT Primary·prefix·backendProgramType은 제외한다', () => {
    expect(isGeneralRecruitmentRowProgram(program({ id: '182101' }))).toBe(false)
    expect(isGeneralRecruitmentRowProgram(program({ id: 'ujat-local-1' }))).toBe(false)
    expect(
      isGeneralRecruitmentRowProgram(program({ id: '186021', backendProgramType: 'UJAT' }))
    ).toBe(false)
  })

  it('1사1교·교육받은 교사는 제외한다', () => {
    expect(
      isGeneralRecruitmentRowProgram(program({ id: 'company-school-prog-1', title: '1사1교' }))
    ).toBe(false)
    expect(isGeneralRecruitmentRowProgram(program({ id: '186001' }))).toBe(false)
  })
})
