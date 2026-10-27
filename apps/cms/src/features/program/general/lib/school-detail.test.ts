import { describe, expect, it } from 'vitest'
import { mergeOrganizationApplicationDetailOntoSchoolDetail } from './school-detail'
import type { SchoolDetailForModal } from '../model/school-detail-types'

const baseDetail: SchoolDetailForModal = {
  id: 'application-1',
  schoolName: '목록 기관명',
  region: '목록 지역',
  educationGrade: '3학년',
  classCount: 4,
  studentCount: 80,
  lectureRound: '1회차',
  textbookStatus: 'not_applicable',
  instructors: [],
  teacherName: '목록 담당자',
  teacherPhone: '목록 전화번호',
}

describe('mergeOrganizationApplicationDetailOntoSchoolDetail', () => {
  it('상세 응답의 명시적 null·빈 값은 목록 캐시 값으로 되살리지 않는다', () => {
    const merged = mergeOrganizationApplicationDetailOntoSchoolDetail(
      baseDetail,
      {
        organizationName: null,
        organizationAddress: '',
        organizationAddressDetail: null,
        requestedGrade: null,
        requestedClassCount: null,
        requestedStudentCount: null,
        teacherName: null,
        teacherPhone: null,
        teacherEmail: null,
        applicationReason: null,
        otherRequests: '',
      } as unknown as import('@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse').OrganizationApplicationDetailResponse
    )

    expect(merged.schoolName).toBe('-')
    expect(merged.region).toBe('-')
    expect(merged.addressDetail).toBeUndefined()
    expect(merged.educationGrade).toBe('-')
    expect(merged.classCount).toBe(0)
    expect(merged.studentCount).toBe(0)
    expect(merged.teacherName).toBeUndefined()
    expect(merged.teacherPhone).toBeUndefined()
    expect(merged.teacherMobile).toBeUndefined()
    expect(merged.teacherEmail).toBeUndefined()
    expect(merged.applicationReason).toBeUndefined()
    expect(merged.otherRequests).toBeUndefined()
  })

  it('상세 응답에서 생략된 선택 필드는 기존 목록 값을 되살리지 않는다', () => {
    const merged = mergeOrganizationApplicationDetailOntoSchoolDetail(baseDetail, {})

    expect(merged.schoolName).toBe('-')
    expect(merged.region).toBe('-')
    expect(merged.classCount).toBe(0)
    expect(merged.studentCount).toBe(0)
    expect(merged.teacherName).toBeUndefined()
    expect(merged.teacherPhone).toBeUndefined()
    expect(merged.teacherMobile).toBeUndefined()
  })

  it('nested textbook.kits·quantity와 문자열 수량을 읽는다', () => {
    const nested = mergeOrganizationApplicationDetailOntoSchoolDetail(baseDetail, {
      textbook: { kits: '3', quantity: '72' },
    } as unknown as import('@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse').OrganizationApplicationDetailResponse)
    expect(nested.textbookKits).toBe(3)
    expect(nested.textbookQuantity).toBe(72)

    const topLevel = mergeOrganizationApplicationDetailOntoSchoolDetail(baseDetail, {
      textbookKits: 2,
      textbookQuantity: 48,
    })
    expect(topLevel.textbookKits).toBe(2)
    expect(topLevel.textbookQuantity).toBe(48)
  })

  it('상세 GET의 키트·권수가 null이면 목록 캐시 수량을 되살리지 않는다', () => {
    const merged = mergeOrganizationApplicationDetailOntoSchoolDetail(
      { ...baseDetail, textbookKits: 9, textbookQuantity: 216 },
      {
        textbookKits: null,
        textbookQuantity: null,
      } as unknown as import('@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse').OrganizationApplicationDetailResponse
    )

    expect(merged.textbookKits).toBeUndefined()
    expect(merged.textbookQuantity).toBeUndefined()
  })

  it('teacherTel은 Tel, teacherPhone은 휴대폰으로 나눈다', () => {
    const merged = mergeOrganizationApplicationDetailOntoSchoolDetail(baseDetail, {
      teacherName: '김교사',
      teacherTel: '02-1234-5678',
      teacherPhone: '010-1111-2222',
      teacherEmail: 'teacher@example.com',
      organizationAddress: '서울시 종로구',
      organizationAddressDetail: '3층 교무실',
    })

    expect(merged.teacherName).toBe('김교사')
    expect(merged.teacherPhone).toBe('02-1234-5678')
    expect(merged.teacherMobile).toBe('010-1111-2222')
    expect(merged.teacherEmail).toBe('teacher@example.com')
    expect(merged.region).toBe('서울시 종로구')
    expect(merged.addressDetail).toBe('3층 교무실')
  })
})
