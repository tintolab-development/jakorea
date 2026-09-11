import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import {
  detailEmailDisplay,
  detailPhoneDisplay,
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

  it('detailPhoneDisplay — BE 마스킹 전화는 *를 유지한다 (revealed여도 format 금지)', () => {
    const user = baseUser({ phone: '010-****-8216' })
    expect(detailPhoneDisplay(user, false)).toBe('010-****-8216')
    expect(detailPhoneDisplay(user, true)).toBe('010-****-8216')
  })

  it('detailPhoneDisplay — 원문은 revealed 시 하이픈 포맷', () => {
    expect(detailPhoneDisplay(baseUser({ phone: '01012345678' }), true)).toBe('010-1234-5678')
  })

  it('detailEmailDisplay — BE 마스킹 이메일은 *를 유지한다', () => {
    const user = baseUser({ email: 'instructor02.d***@jakorea.org' })
    expect(detailEmailDisplay(user, false)).toBe('instructor02.d***@jakorea.org')
    expect(detailEmailDisplay(user, true)).toBe('instructor02.d***@jakorea.org')
  })

  it('detailEmailDisplay — 원문은 revealed 시 그대로', () => {
    expect(detailEmailDisplay(baseUser({ email: 'instructor02.dev@jakorea.org' }), true)).toBe(
      'instructor02.dev@jakorea.org'
    )
  })
})
