import { describe, expect, it } from 'vitest'
import { mapOrganizationApplicationDetailToParticipatingEditFields } from './organization-application-detail-edit-fields'

describe('mapOrganizationApplicationDetailToParticipatingEditFields', () => {
  it('상세 GET의 교재·교사·사유를 편집 필드로 투영한다', () => {
    expect(
      mapOrganizationApplicationDetailToParticipatingEditFields({
        organizationAddressDetail: '본관 3층',
        requestedEducationFormat: 'ONLINE',
        applicationReason: '금융 교육',
        otherRequests: '주차',
        teacherName: '김교사',
        teacherTel: '02-1234-5678',
        teacherPhone: '010-1111-2222',
        teacherEmail: 't@school.kr',
        requestedGrade: '2',
        textbookId: 55,
        textbookName: '성공하는 경제생활',
        requestedClassCount: 2,
        requestedStudentCount: 40,
      })
    ).toMatchObject({
      addressDetail: '본관 3층',
      educationFormat: '온라인',
      applicationReason: '금융 교육',
      otherRequests: '주차',
      teacherName: '김교사',
      teacherPhone: '02-1234-5678',
      teacherMobile: '010-1111-2222',
      teacherEmail: 't@school.kr',
      educationGrade: '2',
      textbookId: '55',
      textbookName: '성공하는 경제생활',
      classCount: 2,
      studentCount: 40,
    })
  })

  it('textbookId null이면 해당 없음으로 표시한다', () => {
    expect(
      mapOrganizationApplicationDetailToParticipatingEditFields({
        textbookId: null,
        textbookName: null,
      } as unknown as Parameters<
        typeof mapOrganizationApplicationDetailToParticipatingEditFields
      >[0])
    ).toMatchObject({
      textbookName: '해당 없음',
    })
  })
})
