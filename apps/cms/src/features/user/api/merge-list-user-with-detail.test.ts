import { describe, expect, it } from 'vitest'
import { mergeListUserWithFetchedDetail } from './merge-list-user-with-detail'
import type { User } from '@/types/user'

function baseUser(partial: Partial<Omit<User, 'password'>>): Omit<User, 'password'> {
  return {
    id: 'list-uuid',
    email: 'school@example.com',
    name: '서울고등학교',
    role: 'SCHOOL',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    schoolInfo: {
      schoolName: '서울고등학교',
      address: '서울시',
    },
    memberId: 42,
    ...partial,
  }
}

describe('mergeListUserWithFetchedDetail', () => {
  it('상세가 INDIVIDUAL로 오면 목록 SCHOOL 역할을 유지한다', () => {
    const list = baseUser({})
    const fetched = baseUser({
      id: 'detail-uuid',
      role: 'INDIVIDUAL',
      name: '담당자',
      schoolInfo: undefined,
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.role).toBe('SCHOOL')
    expect(merged.id).toBe('list-uuid')
    expect(merged.schoolInfo?.schoolName).toBe('서울고등학교')
    expect(merged.name).toBe('서울고등학교')
  })

  it('교사 drill-down 시 API name이 기관명이면 목록 교사명을 유지한다', () => {
    const list = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '박충재',
      instructorMemberProfile: 'school_teacher',
      affiliatedSchoolName: 'JA 테스트 중학교',
      schoolInfo: undefined,
    })
    const fetched = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: 'JA 테스트 중학교',
      affiliatedSchoolName: 'JA 테스트 중학교',
      schoolInfo: {
        schoolName: 'JA 테스트 중학교',
        address: '',
      },
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.name).toBe('박충재')
    expect(merged.schoolInfo).toBeUndefined()
  })

  it('상세 계좌 정보를 목록 빈 instructorInfo 위에 병합한다', () => {
    const list = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      instructorMemberProfile: 'school_teacher',
      schoolInfo: undefined,
      instructorInfo: {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        isBusinessIncome: false,
      },
    })
    const fetched = baseUser({
      id: 'teacher-uuid',
      role: 'INSTRUCTOR',
      name: '김강사',
      schoolInfo: undefined,
      instructorInfo: {
        bankName: '우리은행',
        accountNumber: '1002-859-723089',
        accountHolder: '김강사',
        isBusinessIncome: true,
      },
    })

    const merged = mergeListUserWithFetchedDetail(list, fetched)

    expect(merged.instructorInfo).toEqual({
      bankName: '우리은행',
      accountNumber: '1002-859-723089',
      accountHolder: '김강사',
      isBusinessIncome: true,
    })
  })
})
