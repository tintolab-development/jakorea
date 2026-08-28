import { describe, expect, it, vi } from 'vitest'
import type { User } from '@/types/user'
import { userToApplicantInstructorRow } from './user-to-applicant-instructor-row'

vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMembersRemoteEnabled: () => true,
  isInstructorRoleRequestsRemoteEnabled: () => false,
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

  it('한 줄 소개(bio)와 자유작성 1번(selfIntroduction)을 분리한다', () => {
    const row = userToApplicantInstructorRow(
      baseUser({
        bio: '짧은 한 줄 소개',
        instructorSelfIntroduction: '긴 자기소개 및 지원동기',
      })
    )

    expect(row.oneLineIntro).toBe('짧은 한 줄 소개')
    expect(row.freeWriting1).toBe('긴 자기소개 및 지원동기')
  })

  it('selfIntroduction이 없으면 자유작성 1번도 빈칸이다', () => {
    const row = userToApplicantInstructorRow(baseUser())

    expect(row.freeWriting1).toBe('')
    expect(row.freeWriting2).toBe('')
  })

  it('remote에서 affiliation empty면 `-`를 사용한다', () => {
    const row = userToApplicantInstructorRow(baseUser({ affiliation: undefined }))
    expect(row.affiliation).toBe('-')
  })

  it('remote에서 affiliation 값이 있으면 그대로 사용한다', () => {
    const row = userToApplicantInstructorRow(baseUser({ affiliation: '서울 JA' }))
    expect(row.affiliation).toBe('서울 JA')
  })

  it('instructorCmsProfile structured 필드를 이력서 row에 바인딩한다', () => {
    const row = userToApplicantInstructorRow(
      baseUser({
        birthDate: '1994-04-04',
        gender: 'F',
        instructorCmsProfile: {
          memberType: 'GENERAL',
          affiliation: { organizationNames: [] },
          homeAddress: { line: '서울' },
          education: {
            highestSchoolType: 'college4',
            highestStatus: 'graduated',
            college4: [{ schoolName: '한국대학교' }],
          },
          career: {
            level: 'experienced',
            rows: [{ companyName: 'JA', roleName: '강사', currentlyEmployed: false }],
          },
          jaKoreaActivities: [{ title: 'JA 프로그램' }],
          licenses: [{ title: '강사 자격', acquiredYear: '2023' }],
          awards: [{ title: '수상', acquiredYear: '2022' }],
          essays: { freeWrite1: '지원동기', freeWrite2: '2', freeWrite3: '3', freeWrite4: '4' },
          defaultFeeGrade: null,
          defaultJaGrade: null,
        },
      })
    )

    expect(row.instructorCareerLevel).toBe('experienced')
    expect(row.freeWriting1).toBe('지원동기')
    expect(row.educations?.length).toBeGreaterThan(0)
    expect(row.qualifications?.length).toBe(1)
    expect(row.awards?.length).toBe(1)
    expect(row.jaKoreaActivities?.length).toBe(1)
    expect(row.careerDetails?.length).toBe(1)
    expect(row.awards?.[0]?.name).toBe('수상')
  })
})
