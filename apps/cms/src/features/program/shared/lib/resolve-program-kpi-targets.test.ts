import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  hasProgramKpiTargets,
  resolveProgramKpiTargets,
} from './resolve-program-kpi-targets'

describe('resolveProgramKpiTargets', () => {
  it('generalCommonInfo.kpi를 우선한다', () => {
    const program = {
      generalCommonInfo: {
        kpi: {
          finalParticipants: 36,
          instructorCount: 7,
          volunteerCount: 0,
          finalSchools: 9,
          finalClasses: 13,
        },
      },
      totalParticipants: 1,
      instructors: 2,
    } as Program

    expect(resolveProgramKpiTargets(program)).toEqual({
      finalParticipants: 36,
      instructorCount: 7,
      volunteerCount: 0,
      finalSchools: 9,
      finalClasses: 13,
    })
  })

  it('kpi가 없으면 top-level 컬럼으로 폴백한다', () => {
    const program = {
      totalParticipants: 36,
      instructors: 7,
      participatingSchoolCount: 9,
    } as Program

    expect(resolveProgramKpiTargets(program)).toEqual({
      finalParticipants: 36,
      instructorCount: 7,
      volunteerCount: undefined,
      finalSchools: 9,
      finalClasses: undefined,
    })
  })

  it('목표값이 하나라도 있으면 hasProgramKpiTargets는 true', () => {
    expect(hasProgramKpiTargets({ finalParticipants: 10 })).toBe(true)
    expect(hasProgramKpiTargets({})).toBe(false)
  })
})
