import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import {
  highestEducationLine,
  instructorCareerYearsLine,
  oneLineIntroLine,
} from './display'

function baseUser(partial: Partial<Omit<User, 'password'>> = {}): Omit<User, 'password'> {
  return {
    id: 'u-1',
    memberId: 1,
    email: 'a@b.com',
    name: '테스트',
    role: 'INSTRUCTOR',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('instructor detail masked field display', () => {
  it('oneLineIntroLine — BE `"마스킹"` placeholder는 `-`로 표시한다', () => {
    expect(oneLineIntroLine(baseUser({ bio: '마스킹' }))).toBe('-')
    expect(oneLineIntroLine(baseUser({ bio: undefined }))).toBe('-')
  })

  it('instructorCareerYearsLine — BE `"마스킹"` placeholder는 `-`로 표시한다', () => {
    expect(
      instructorCareerYearsLine(
        baseUser({
          instructorCareerText: '마스킹',
          listMetrics: { instructorCareerYearsLabel: '마스킹' },
        })
      )
    ).toBe('-')
  })

  it('highestEducationLine — `"마스킹"` placeholder는 `-`로 표시한다', () => {
    expect(
      highestEducationLine(
        baseUser({
          listMetrics: { highestEducationLabel: '마스킹' },
        })
      )
    ).toBe('-')
  })

  it('highestEducationLine — educationLevel 코드를 한글로 표시한다', () => {
    expect(
      highestEducationLine(
        baseUser({
          listMetrics: { highestEducationLabel: 'college4 / graduated' },
        })
      )
    ).toBe('대학교 4년제 / 졸업')
  })
})
