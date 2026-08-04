import { describe, expect, it } from 'vitest'
import { userDetailModalTitle } from './user-detail-fullpage-helpers'
import {
  applyTeacherDetailUrlContext,
  readTeacherDetailUrlContext,
  teacherDetailUrlParamsFromUser,
} from './teacher-detail-url-context'
import type { User } from '@/types/user'

describe('userDetailModalTitle', () => {
  it('교사 상세에서 학교명이 없으면 하이픈 세그먼트를 넣지 않는다', () => {
    const title = userDetailModalTitle({
      name: '김교사',
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'school_teacher',
    })
    expect(title).toBe('교사 상세 (김교사)')
    expect(title).not.toContain('_-_')
  })

  it('교사 상세에서 학교명이 있으면 괄호 안에 학교_성명 형식을 쓴다', () => {
    expect(
      userDetailModalTitle({
        name: '김교사',
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_dual',
        affiliatedSchoolName: '진월초등학교',
      })
    ).toBe('교사 상세 (진월초등학교_김교사)')
  })

  it('강사·회원·학교·관리자 상세도 괄호 형식을 쓴다', () => {
    expect(
      userDetailModalTitle({
        name: '박틴토',
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_only',
      })
    ).toBe('강사 상세 (박틴토)')
    expect(userDetailModalTitle({ name: '홍길동', role: 'INDIVIDUAL' })).toBe('회원 상세 (홍길동)')
    expect(userDetailModalTitle({ name: '진월초', role: 'SCHOOL' })).toBe('학교 상세 (진월초)')
    expect(userDetailModalTitle({ name: '관리자', role: 'ADMIN' })).toBe('관리자 상세 (관리자)')
  })
})

describe('teacher-detail-url-context', () => {
  it('URL 컨텍스트로 학교명·프로필을 복원한다', () => {
    const base = {
      id: 'u1',
      email: 't@example.com',
      name: '김교사',
      role: 'INSTRUCTOR',
    } as unknown as Omit<User, 'password'>

    const next = applyTeacherDetailUrlContext(base, {
      affiliatedSchoolName: '진월초등학교',
      instructorMemberProfile: 'instructor_dual',
    })

    expect(next.affiliatedSchoolName).toBe('진월초등학교')
    expect(next.instructorMemberProfile).toBe('instructor_dual')
  })

  it('teacherDetailUrlParamsFromUser는 resolved 프로필을 넣는다', () => {
    const params = teacherDetailUrlParamsFromUser({
      role: 'INSTRUCTOR',
      affiliatedSchoolUserId: 'school-1',
      affiliatedSchoolName: '진월초등학교',
    })
    expect(params.affiliatedSchool).toBe('진월초등학교')
    expect(params.instructorProfile).toBe('instructor_dual')
  })

  it('URL instructor_only는 API dual 추론보다 우선한다', () => {
    const base = {
      id: 'u1',
      email: 't@example.com',
      name: '김교사',
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'instructor_dual',
      affiliatedSchoolName: '진월초등학교',
    } as unknown as Omit<User, 'password'>

    const next = applyTeacherDetailUrlContext(base, {
      instructorMemberProfile: 'instructor_only',
    })

    expect(next.instructorMemberProfile).toBe('instructor_only')
  })

  it('readTeacherDetailUrlContext는 쿼리를 파싱한다', () => {
    const sp = new URLSearchParams(
      'affiliatedSchool=%EC%A7%84%EC%9B%94%EC%B4%88%EB%93%B1%ED%95%99%EA%B5%90&instructorProfile=school_teacher'
    )
    expect(readTeacherDetailUrlContext(sp)).toEqual({
      affiliatedSchoolName: '진월초등학교',
      instructorMemberProfile: 'school_teacher',
    })
  })
})
