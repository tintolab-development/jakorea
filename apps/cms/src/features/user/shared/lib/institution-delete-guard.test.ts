import { describe, expect, it } from 'vitest'
import { institutionHasRegisteredTeachers } from './institution-delete-guard'
import type { User } from '@/types/user'

function school(partial: Pick<User, 'listMetrics' | 'schoolInfo'>): Pick<
  User,
  'listMetrics' | 'schoolInfo'
> {
  return partial
}

describe('institutionHasRegisteredTeachers', () => {
  it('등록 교사 수가 0이면 삭제 가능이다', () => {
    expect(
      institutionHasRegisteredTeachers(
        school({ listMetrics: { institutionRegisteredTeacherCount: 0 } })
      )
    ).toBe(false)
  })

  it('등록 교사 수가 1 이상이면 삭제를 막는다', () => {
    expect(
      institutionHasRegisteredTeachers(
        school({ listMetrics: { institutionRegisteredTeacherCount: 1 } })
      )
    ).toBe(true)
  })
})
