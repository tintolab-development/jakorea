import { describe, expect, it } from 'vitest'
import {
  enrichUjatInstitutionDetailFromRemote,
  mapOrganizationApplicationDetailToUjatInstitutionRow,
  mapOrganizationApplicationToUjatInstitutionRow,
  mapVolunteerApplicationToUjatApplicantRow,
  toSeoulYmd,
} from './applications-adapters'

describe('toSeoulYmd', () => {
  it('uses Asia/Seoul calendar day', () => {
    expect(toSeoulYmd('2026-10-16T00:00:00+09:00')).toBe('2026-10-16')
    expect(toSeoulYmd('2026-10-16T15:00:00Z')).toBe('2026-10-17')
  })
})

describe('UJAT 기관 신청 상세 adapter', () => {
  it('목록 페이지에 없는 신청도 상세 응답만으로 행을 만든다', () => {
    const row = mapOrganizationApplicationDetailToUjatInstitutionRow({
      id: 186101,
      programId: 186001,
      organizationName: '상세 기관',
      applicationStatus: 'APPROVED',
      requestedClassCount: 2,
      requestedGrade: '2학년',
    })

    expect(row.id).toBe('186101')
    expect(row.institutionName).toBe('상세 기관')
    expect(row.totalClassCount).toBe(2)
    expect(row.gradeClassCounts[0]?.gradeLabel).toBe('2학년')
    expect(row.gradeClassCounts[0]?.classCount).toBe(2)
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
    const detail = enrichUjatInstitutionDetailFromRemote(
      row,
      {
        organizationAddress: null,
        organizationAddressDetail: null,
        managerComment: null,
        teacherName: null,
        teacherTel: null,
        teacherPhone: null,
        teacherEmail: null,
        preferredEducationDates: null,
      } as unknown as import('@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse').OrganizationApplicationDetailResponse
    )

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

describe('UJAT 기관 신청 목록 adapter', () => {
  it('희망 일정 startAt만 날짜 열 O로 넣고 빈 기관명은 -', () => {
    const row = mapOrganizationApplicationToUjatInstitutionRow(
      {
        id: 11,
        organizationName: '  ',
        applicationStatus: 'SUBMITTED',
        requestedClassCount: 1,
        grade: '3학년',
        preferredEducationSchedules: [{ startAt: '2026-11-04T10:00:00+09:00' }],
        sessions: [{ startAt: '2026-11-11T10:00:00+09:00' }],
      },
      0
    )

    expect(row.institutionName).toBe('-')
    expect(row.gradeClassCounts).toEqual([{ gradeLabel: '3학년', classCount: 1 }])
    expect(row.scheduleSlots['2026-11-04']).toBe('O')
    expect(row.sessionIsoDates).toEqual(['2026-11-11'])
  })

  it('빈 희망일은 날짜 열을 채우지 않고 gradeBlocks를 여러 줄로 쓴다', () => {
    const row = mapOrganizationApplicationToUjatInstitutionRow(
      {
        id: 12,
        organizationName: '다학년 학교',
        applicationStatus: 'SUBMITTED',
        grade: '1학년',
        requestedClassCount: 9,
        preferredEducationSchedules: [],
        sessions: [],
        gradeBlocks: [
          { gradeLabel: '1학년', classCount: 2 },
          { gradeLabel: '2학년', classCount: 1 },
        ],
      },
      0
    )

    expect(row.scheduleSlots).toEqual({})
    expect(row.sessionIsoDates).toEqual([])
    expect(row.gradeClassCounts).toEqual([
      { gradeLabel: '1학년', classCount: 2 },
      { gradeLabel: '2학년', classCount: 1 },
    ])
    expect(row.totalClassCount).toBe(3)
  })
})

describe('UJAT 봉사자 목록 adapter', () => {
  it('GET 서술형·학년·연락처를 비우지 않는다', () => {
    const row = mapVolunteerApplicationToUjatApplicantRow(
      {
        id: 21,
        programId: 186290,
        memberName: '김봉사',
        grade: '3학년',
        preferredRegion: '서울',
        contact: '010-****-1234',
        email: 'a***@school.kr',
        hasEducationExperience: true,
        essayIntro: '지원동기 원문',
        essayEducationExperience: '교육경험 원문',
        essayNecessity: '필요성 원문',
        essayJaExperience: 'JA 경험 원문',
        totalAssignedDays: null,
      },
      0,
      '186290',
      'h2'
    )

    expect(row.name).toBe('김봉사')
    expect(row.grade).toBe('3학년')
    expect(row.preferredRegion).toBe('서울')
    expect(row.contact).toBe('010-****-1234')
    expect(row.essayIntro).toBe('지원동기 원문')
    expect(row.essayEducationExperience).toBe('교육경험 원문')
    expect(row.essayNecessity).toBe('필요성 원문')
    expect(row.essayJaExperience).toBe('JA 경험 원문')
    expect(row.hasEducationExperience).toBe(true)
    expect(row.totalAssignedDays).toBeNull()
  })

  it('서술형이 없으면 빈 문자열을 유지하고 학년 코드를 변환하지 않는다', () => {
    const row = mapVolunteerApplicationToUjatApplicantRow(
      { id: 22, memberName: '이봉사', grade: 'leave' },
      0,
      '186290',
      'h2'
    )
    expect(row.essayIntro).toBe('')
    expect(row.grade).toBe('leave')
    expect(row.contact).toBe('-')
    expect(row.totalAssignedDays).toBeNull()
  })
})
