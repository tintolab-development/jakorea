import { describe, expect, it } from 'vitest'
import {
  enrichUjatInstitutionDetailFromRemote,
  mapOrganizationApplicationDetailToUjatInstitutionRow,
} from './applications-adapters'

describe('UJAT 기관 신청 상세 adapter', () => {
  it('목록 페이지에 없는 신청도 상세 응답만으로 행을 만든다', () => {
    const row = mapOrganizationApplicationDetailToUjatInstitutionRow({
      id: 186101,
      programId: 186001,
      organizationName: '상세 기관',
      applicationStatus: 'APPROVED',
      requestedClassCount: 2,
      requestedGrade: '2',
    })

    expect(row.id).toBe('186101')
    expect(row.institutionName).toBe('상세 기관')
    expect(row.totalClassCount).toBe(2)
    expect(row.gradeClassCounts[0]?.gradeLabel).toBe('2')
  })

  it('상세 응답의 UJAT 전용 필드를 행에 반영한다', () => {
    const row = mapOrganizationApplicationDetailToUjatInstitutionRow({
      id: 2,
      organizationName: 'UJAT 기관',
      applicationStatus: 'APPROVED',
      educationRegionCode: 'SEOUL',
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      scheduleConfirmStatus: 'institution_confirmed',
      assignedInstructorCount: 2,
      operatingStudentCount: 24,
    })

    expect(row.regionKey).toBe('seoul')
    expect(row.tempAssignmentStatus).toBe('temp_assigned')
    expect(row.scheduleConfirmStatus).toBe('institution_confirmed')
    expect(row.assignedInstructorCount).toBe(2)
    expect(row.operatingStudentCount).toBe(24)
  })

  it('상세 응답의 명시적 null은 목록 기본값으로 되살리지 않는다', () => {
    const row = mapOrganizationApplicationDetailToUjatInstitutionRow({
      id: 1,
      organizationName: '기관',
      teacherName: '목록 담당자',
      applicationStatus: 'APPROVED',
    })
    const detail = enrichUjatInstitutionDetailFromRemote(row, {
      organizationAddress: null,
      organizationAddressDetail: null,
      managerComment: null,
      teacherName: null,
      teacherTel: null,
      teacherPhone: null,
      teacherEmail: null,
      preferredEducationDates: null,
    })

    expect(detail.address).toBe('')
    expect(detail.addressDetail).toBe('')
    expect(detail.otherRequests).toBe('')
    expect(detail.teacherContact).toEqual({
      teacherName: '',
      tel: '',
      mobile: '',
      email: '',
    })
    expect(detail.preferredEducationDates).toEqual([])
  })
})
