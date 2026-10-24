import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { canUjatRecruitmentInfoEdit } from './ujat-program-info-edit'

const now = new Date('2026-09-28T12:00:00+09:00')

function programWith(recruitments: Program['programRecruitments']): Program {
  return {
    id: 'ujat-1',
    sponsorId: 'sponsor-1',
    title: 'UJAT',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    programRecruitments: recruitments,
  } as Program
}

describe('canUjatRecruitmentInfoEdit', () => {
  it('시작한 반기만 닫고 시작 전 하반기는 연다', () => {
    const program = programWith([
      {
        id: 1,
        recruitmentType: 'VOLUNTEER',
        recruitTerm: 'FIRST_HALF',
        startAt: '2020-01-01T00:00:00+09:00',
      },
      {
        id: 2,
        recruitmentType: 'VOLUNTEER',
        recruitTerm: 'SECOND_HALF',
        startAt: '2099-08-01T00:00:00+09:00',
      },
    ])
    expect(canUjatRecruitmentInfoEdit(program, 'recruit_volunteer_h1', now)).toBe(false)
    expect(canUjatRecruitmentInfoEdit(program, 'recruit_volunteer_h2', now)).toBe(true)
  })

  it('아직 저장되지 않은 하반기는 수정 화면을 연다', () => {
    const program = programWith([
      {
        id: 1,
        recruitmentType: 'VOLUNTEER',
        recruitTerm: 'FIRST_HALF',
        startAt: '2020-01-01T00:00:00+09:00',
      },
    ])
    expect(canUjatRecruitmentInfoEdit(program, 'recruit_volunteer_h2', now)).toBe(true)
  })
})
