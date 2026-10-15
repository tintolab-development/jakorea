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
    const merged = mergeOrganizationApplicationDetailOntoSchoolDetail(baseDetail, {
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
    })

    expect(merged.schoolName).toBe('')
    expect(merged.region).toBe('')
    expect(merged.addressDetail).toBeUndefined()
    expect(merged.educationGrade).toBe('')
    expect(merged.classCount).toBe(0)
    expect(merged.studentCount).toBe(0)
    expect(merged.teacherName).toBeUndefined()
    expect(merged.teacherPhone).toBeUndefined()
    expect(merged.teacherEmail).toBeUndefined()
    expect(merged.applicationReason).toBeUndefined()
    expect(merged.otherRequests).toBe('')
  })

  it('상세 응답에 필드가 없으면 기존 목록 값을 보존한다', () => {
    const merged = mergeOrganizationApplicationDetailOntoSchoolDetail(baseDetail, {})

    expect(merged.schoolName).toBe('목록 기관명')
    expect(merged.region).toBe('목록 지역')
    expect(merged.classCount).toBe(4)
    expect(merged.studentCount).toBe(80)
    expect(merged.teacherName).toBe('목록 담당자')
    expect(merged.teacherPhone).toBe('목록 전화번호')
  })
})
