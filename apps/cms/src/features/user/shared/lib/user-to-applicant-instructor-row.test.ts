import { describe, expect, it, vi } from 'vitest'
import type { User } from '@/types/user'
import { userToApplicantInstructorRow } from './user-to-applicant-instructor-row'

vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMembersRemoteEnabled: () => true,
}))

function baseUser(partial: Partial<Omit<User, 'password'>> = {}): Omit<User, 'password'> {
  return {
    id: 'u-1',
    memberId: 1,
    email: 'a@b.com',
    name: '김강사',
    role: 'INSTRUCTOR',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('userToApplicantInstructorRow', () => {
  it('자유작성 1번만 selfIntroduction을 사용한다', () => {
    const row = userToApplicantInstructorRow(
      baseUser({
        instructorSelfIntroduction: 'ㅋㅋ',
        instructorCareerText: '10',
      })
    )

    expect(row.freeWriting1).toBe('ㅋㅋ')
  })

  it('careerText를 자유작성 2번에 넣지 않는다', () => {
    const row = userToApplicantInstructorRow(
      baseUser({
        instructorSelfIntroduction: 'ㅋㅋ',
        instructorCareerText: '10',
      })
    )

    expect(row.freeWriting2).toBe('')
    expect(row.freeWriting3).toBe('')
    expect(row.freeWriting4).toBe('')
  })

  it('selfIntroduction이 없으면 자유작성 1번도 빈칸이다', () => {
    const row = userToApplicantInstructorRow(baseUser())

    expect(row.freeWriting1).toBe('')
    expect(row.freeWriting2).toBe('')
  })
})
