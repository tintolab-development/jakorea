import { describe, expect, it } from 'vitest'
import { parseAssignedInstructorList } from '../src/features/mypage/education/applications/api/assigned-instructors'
import {
  resolveAssignedInstructorCardBody,
  resolveAssignedInstructorQueryView,
  shouldMountTeacherEducationAssignmentAside,
  shouldShowTeacherAssignmentAside,
} from '../src/features/mypage/education/applications/lib/teacher-assignment-aside'

describe('shouldMountTeacherEducationAssignmentAside', () => {
  it('교사 ORGANIZATION·INDIVIDUAL은 teacherAssignment 없어도 마운트한다', () => {
    expect(
      shouldMountTeacherEducationAssignmentAside({
        isTeacher: true,
        applicationType: 'ORGANIZATION',
        hasTeacherAssignment: false,
      }),
    ).toBe(true)
    expect(
      shouldMountTeacherEducationAssignmentAside({
        isTeacher: true,
        applicationType: 'INDIVIDUAL',
        hasTeacherAssignment: false,
      }),
    ).toBe(true)
  })

  it('봉사 신청은 teacherAssignment가 없으면 마운트하지 않는다', () => {
    expect(
      shouldMountTeacherEducationAssignmentAside({
        isTeacher: true,
        applicationType: 'VOLUNTEER',
        hasTeacherAssignment: false,
      }),
    ).toBe(false)
  })
})

describe('assigned instructor query view', () => {
  it('로딩·오류를 0명으로 취급하지 않는다', () => {
    const loading = resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: true,
      isError: false,
      isSuccess: false,
      instructorCount: 0,
    })
    const error = resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: false,
      isError: true,
      isSuccess: false,
      instructorCount: 0,
    })
    const empty = resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: false,
      isError: false,
      isSuccess: true,
      instructorCount: 0,
    })
    expect(loading.kind).toBe('loading')
    expect(error.kind).toBe('error')
    expect(empty.kind).toBe('empty')
    expect(shouldShowTeacherAssignmentAside({ hasTextbook: false, instructorView: loading })).toBe(
      true,
    )
    expect(shouldShowTeacherAssignmentAside({ hasTextbook: false, instructorView: error })).toBe(
      true,
    )
    expect(shouldShowTeacherAssignmentAside({ hasTextbook: false, instructorView: empty })).toBe(
      false,
    )
  })

  it('교재 카드 노출은 강사 조회 상태와 독립이다', () => {
    const empty = resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: false,
      isError: false,
      isSuccess: true,
      instructorCount: 0,
    })
    expect(shouldShowTeacherAssignmentAside({ hasTextbook: true, instructorView: empty })).toBe(true)
  })

  it('강사 1명·여러 명을 ready로 본다', () => {
    expect(
      resolveAssignedInstructorQueryView({
        enabled: true,
        isPending: false,
        isError: false,
        isSuccess: true,
        instructorCount: 1,
      }).kind,
    ).toBe('ready')
    expect(
      resolveAssignedInstructorQueryView({
        enabled: true,
        isPending: false,
        isError: false,
        isSuccess: true,
        instructorCount: 3,
      }),
    ).toEqual({ kind: 'ready', instructorCount: 3 })
  })
})

describe('parseAssignedInstructorList', () => {
  it('동의서 없는 배정 강사도 이름만 남긴다', () => {
    expect(
      parseAssignedInstructorList({
        instructors: [{ instructorMemberId: 190001, name: '이건희' }],
      }),
    ).toEqual({
      instructors: [
        {
          instructorMemberId: 190001,
          name: '이건희',
          consentDocumentsRequested: false,
          consents: [],
        },
      ],
    })
  })

  it('envelope·instructorName 응답도 매핑한다', () => {
    expect(
      parseAssignedInstructorList({
        success: true,
        data: {
          assignments: [
            { instructorMemberId: '190002', instructorName: '김강사' },
            { instructorMemberId: 190002, instructorName: '김강사' },
          ],
        },
      }).instructors,
    ).toEqual([
      {
        instructorMemberId: 190002,
        name: '김강사',
        consentDocumentsRequested: false,
        consents: [],
      },
      {
        instructorMemberId: 190002,
        name: '김강사',
        consentDocumentsRequested: false,
        consents: [],
      },
    ])
  })

  it('이름이 없는 행은 만들지 않는다', () => {
    expect(
      parseAssignedInstructorList({
        instructors: [{ instructorMemberId: 1, consents: [] }],
      }),
    ).toEqual({ instructors: [] })
  })
})

describe('CASE 1/2/3 vs 강사명', () => {
  it('CASE 데이터와 강사 목록을 분리한다', () => {
    expect(resolveAssignedInstructorCardBody('ja_system')).toBe('consents')
    expect(resolveAssignedInstructorCardBody('site_direct')).toBe('site_direct')
    expect(resolveAssignedInstructorCardBody('site_online')).toBe('site_online')
    expect(resolveAssignedInstructorCardBody(null)).toBe('name_only')
    expect(resolveAssignedInstructorCardBody(undefined)).toBe('consents')
  })
})
