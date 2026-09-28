import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveUjatProgramDisplayTitle } from './ujat-program-list-display'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'ujat-1',
    title: '프로그램 관리명',
    type: 'offline',
    format: 'course',
    category: 'school',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    ...overrides,
  } as Program
}

describe('resolveUjatProgramDisplayTitle', () => {
  it('목록·모달 타이틀은 대표 프로그램명(mainTitle)을 쓴다', () => {
    expect(
      resolveUjatProgramDisplayTitle(
        baseProgram({
          title: '프로그램 관리명',
          mainTitle: '우리 동네 소비와 저축',
        })
      )
    ).toBe('우리 동네 소비와 저축')
  })

  it('mainTitle이 없으면 overlay 대표 국문을 쓴다', () => {
    expect(
      resolveUjatProgramDisplayTitle(
        baseProgram({
          title: '프로그램 관리명',
          ujatRegistrationOverlay: {
            'ujat.basicInfo.repKo': '기업가정신 스타트업 체험',
          },
        })
      )
    ).toBe('기업가정신 스타트업 체험')
  })
})
