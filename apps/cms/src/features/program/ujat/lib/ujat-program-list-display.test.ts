import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  formatUjatDispatchedSchoolCount,
  formatUjatVolunteerHalfRecruitment,
  resolveUjatProgramDisplayTitle,
} from './ujat-program-list-display'

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

describe('formatUjatVolunteerHalfRecruitment', () => {
  it('반기별 모집된 인원 / 정원을 표시한다', () => {
    const program = baseProgram({
      ujatFirstHalfVolunteerSelectedCount: 0,
      ujatFirstHalfVolunteerCapacity: 64,
      ujatSecondHalfVolunteerSelectedCount: 8,
      ujatSecondHalfVolunteerCapacity: null,
    })
    expect(formatUjatVolunteerHalfRecruitment(program, 'h1')).toBe('0 / 64')
    expect(formatUjatVolunteerHalfRecruitment(program, 'h2')).toBe('8 / -')
  })

  it('참여 기관 정원·회차 정원·기본값 30으로 대체하지 않는다', () => {
    const program = baseProgram({
      participantCapacity: 16,
      instructorCapacity: 20,
      generalVolunteers: 5,
      rounds: [{ capacity: 40 }, { capacity: 50 }] as Program['rounds'],
    })
    expect(formatUjatVolunteerHalfRecruitment(program, 'h1')).toBe('0 / -')
    expect(formatUjatVolunteerHalfRecruitment(program, 'h2')).toBe('0 / -')
  })
})

describe('formatUjatDispatchedSchoolCount', () => {
  it('어댑터가 넣은 participatingSchoolCount를 표시하고 없으면 0', () => {
    expect(formatUjatDispatchedSchoolCount(baseProgram({ participatingSchoolCount: 8 }))).toBe('8')
    expect(formatUjatDispatchedSchoolCount(baseProgram())).toBe('0')
  })
})
