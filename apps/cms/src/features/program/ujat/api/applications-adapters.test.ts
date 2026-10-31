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
    expect(row.gradeClassCounts[0]?.classCount).toBeNull()
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

  it('기타 요청사항은 otherRequests를 쓰고 classes가 비면 반 목록을 만들지 않는다', () => {
    const row = mapOrganizationApplicationDetailToUjatInstitutionRow({
      id: 3,
      organizationName: '진월초등학교',
      applicationStatus: 'SUBMITTED',
      educationRegionCode: 'GWANGJU',
      requestedClassCount: 8,
      requestedStudentCount: 202,
    })
    const detail = enrichUjatInstitutionDetailFromRemote(row, {
      organizationName: '진월초등학교',
      educationRegionCode: 'GWANGJU',
      otherRequests: '주차 협의 필요',
      managerComment: '레거시 코멘트',
      preferredEducationDates: ['2026-04-24', '2026-05-08'],
      gradeBlocks: [{ gradeLabel: '1학년', classCount: 8, classes: [] }],
      classTimeRows: [
        {
          gradeRangeLabel: '1학년, 2학년, 3학년',
          periods: ['09:00 ~ 09:40', '09:50 ~ 10:30'],
        },
      ],
    })

    expect(detail.regionLabel).toBe('광주')
    expect(detail.otherRequests).toBe('주차 협의 필요')
    expect(detail.gradeBlocks).toEqual([{ gradeLabel: '1학년', classCount: 8, classes: [] }])
    expect(detail.classTimeRows).toEqual([
      {
        gradeRangeLabel: '1학년, 2학년, 3학년',
        periods: ['09:00 ~ 09:40', '09:50 ~ 10:30', '-', '-'],
      },
    ])
    expect(detail.preferredEducationDates).toEqual(['2026-04-24', '2026-05-08'])
  })

  it('학년 블록 교재는 서버 값만 쓰고 없으면 null을 유지한다', () => {
    const row = mapOrganizationApplicationDetailToUjatInstitutionRow({
      id: 3,
      organizationName: '진월초등학교',
      applicationStatus: 'SUBMITTED',
    })
    const detail = enrichUjatInstitutionDetailFromRemote(row, {
      gradeBlocks: [
        {
          gradeLabel: '6학년',
          classCount: 2,
          classes: [{ classNo: '1반', studentCount: 24 }],
          textbookName: null,
          textbookNameEn: null,
          kitCount: null,
          bookCount: null,
          textbookDeliveryStatus: null,
        },
      ],
    })

    expect(detail.gradeBlocks[0]).toMatchObject({
      gradeLabel: '6학년',
      textbookName: null,
      kitCount: null,
      bookCount: null,
      textbookDeliveryStatus: null,
    })
  })

  it('preferredEducationDates가 비면 preferredEducationSchedules 달력일을 쓴다', () => {
    const row = mapOrganizationApplicationDetailToUjatInstitutionRow({
      id: 4,
      organizationName: '학교',
      applicationStatus: 'SUBMITTED',
    })
    const detail = enrichUjatInstitutionDetailFromRemote(row, {
      preferredEducationDates: null,
      preferredEducationSchedules: [{ startAt: '2026-11-20T00:00:00+09:00' }],
    })

    expect(detail.preferredEducationDates).toEqual(['2026-11-20'])
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
    expect(row.gradeClassCounts).toEqual([{ gradeLabel: '3학년', classCount: null }])
    expect(row.totalClassCount).toBe(1)
    expect(row.scheduleSlots['2026-11-04']).toBe('O')
    expect(row.preferredScheduleIdByIso).toEqual({})
    expect(row.sessionIsoDates).toEqual(['2026-11-11'])
  })

  it('educationDate가 있으면 startAt보다 날짜 열 O에 우선한다', () => {
    const row = mapOrganizationApplicationToUjatInstitutionRow(
      {
        id: 31,
        organizationName: '기관',
        applicationStatus: 'SUBMITTED',
        preferredEducationSchedules: [
          {
            startAt: '2026-11-20T00:00:00+09:00',
            educationDate: '2026-11-06',
          },
          {
            startAt: null,
            educationDate: '2026-11-13',
          },
        ],
      },
      0
    )

    expect(row.scheduleSlots['2026-11-06']).toBe('O')
    expect(row.scheduleSlots['2026-11-13']).toBe('O')
    expect(row.scheduleSlots['2026-11-20']).toBeUndefined()
  })

  it('SUBMITTED는 applicationStatus만으로 임시 배정 배지를 만들지 않는다', () => {
    const row = mapOrganizationApplicationToUjatInstitutionRow(
      {
        id: 1691444,
        organizationName: '기관',
        applicationStatus: 'SUBMITTED',
        educationRegionCode: 'GYEONGGI_SOUTH',
        temporaryAssignmentStatus: null,
        preferredEducationSchedules: [{ startAt: '2027-04-29T15:00:00Z' }],
        gradeBlocks: [{ gradeLabel: '1학년', classCount: 2, classes: [] }],
      },
      0
    )

    expect(row.tempAssignmentStatus).toBe('evaluation_pending')
    expect(row.scheduleSlots['2027-04-30']).toBe('O')
    expect(row.gradeClassCounts).toEqual([{ gradeLabel: '1학년', classCount: 2 }])
  })

  it('preferred scheduleId는 미해결이 아닐 때만 날짜에 붙인다', () => {
    const row = mapOrganizationApplicationToUjatInstitutionRow(
      {
        id: 21,
        organizationName: '기관',
        applicationStatus: 'SUBMITTED',
        preferredEducationSchedules: [
          { startAt: '2027-04-29T15:00:00Z', scheduleId: 111 },
          {
            startAt: '2027-06-03T15:00:00Z',
            scheduleId: null,
            unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
          },
        ],
      },
      0
    )

    expect(row.preferredScheduleIdByIso).toEqual({ '2027-04-30': 111 })
    expect(row.scheduleSlots['2027-06-04']).toBe('O')
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

  it('gradeBlocks가 null이면 requestedClassCount로 학급 줄을 만들지 않는다', () => {
    const row = mapOrganizationApplicationToUjatInstitutionRow(
      {
        id: 13,
        organizationName: '학교',
        applicationStatus: 'SUBMITTED',
        grade: '1학년 2학급',
        requestedClassCount: 2,
        gradeBlocks: null,
        preferredEducationSchedules: [],
      },
      0
    )

    expect(row.gradeClassCounts).toEqual([{ gradeLabel: '1학년 2학급', classCount: null }])
    expect(row.totalClassCount).toBe(2)
  })

  it('No.는 totalElements 기준 역순이다', () => {
    const row = mapOrganizationApplicationToUjatInstitutionRow(
      {
        id: 14,
        organizationName: '학교',
        applicationStatus: 'SUBMITTED',
      },
      0,
      { totalElements: 30 }
    )

    expect(row.no).toBe(30)
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
        preferredRegionCode: 'SEOUL',
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
    expect(row.preferredRegionCode).toBe('SEOUL')
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

  const mapStatus = (
    status: Partial<Parameters<typeof mapVolunteerApplicationToUjatApplicantRow>[0]>
  ) =>
    mapVolunteerApplicationToUjatApplicantRow(
      {
        id: 100,
        programId: 186290,
        memberName: '상태 검증 봉사자',
        ...status,
      },
      0,
      '186290',
      'h2'
    )

  it.each([
    {
      name: 'ST-FIX-01 최종 합격',
      input: {
        applicationStatus: 'APPROVED',
        documentStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'EVALUATED',
        finalResultStatus: 'PASS',
      },
      expected: { document: 'pass', assignment: 'assigned', second: 'pass' },
    },
    {
      name: 'ST-FIX-02 서류 불합격',
      input: {
        applicationStatus: 'REJECTED',
        documentStatus: 'REJECTED',
        interviewStatus: undefined,
        finalResultStatus: undefined,
      },
      expected: { document: 'fail', assignment: 'waiting', second: undefined },
    },
    {
      name: 'ST-FIX-03 면접 불합격',
      input: {
        applicationStatus: 'REJECTED',
        documentStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'EVALUATED',
        finalResultStatus: 'FAIL',
      },
      expected: { document: 'pass', assignment: 'assigned', second: 'fail' },
    },
    {
      name: 'ST-FIX-04 면접 일정 배정',
      input: {
        applicationStatus: 'DOCUMENT_PASSED',
        documentStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'ASSIGNED',
        finalResultStatus: undefined,
      },
      expected: { document: 'pass', assignment: 'assigned', second: 'waiting' },
    },
    {
      name: 'ST-FIX-05 면접 평가 완료',
      input: {
        applicationStatus: 'DOCUMENT_PASSED',
        documentStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'EVALUATED',
        finalResultStatus: undefined,
      },
      expected: { document: 'pass', assignment: 'assigned', second: 'completed' },
    },
  ] as const)('$name', ({ input, expected }) => {
    const row = mapStatus(input)

    expect(row.documentScreeningStatus).toBe(expected.document)
    expect(row.interviewAssignmentStatus).toBe(expected.assignment)
    expect(row.secondInterviewScreeningStatus).toBe(expected.second)
  })

  it('ST-FIX-05 면접 평가 점수와 합계는 상태 변환과 무관하게 유지한다', () => {
    const row = mapStatus({
      applicationStatus: 'DOCUMENT_PASSED',
      documentStatus: 'DOCUMENT_PASSED',
      interviewStatus: 'EVALUATED',
      interviewEvaluations: [
        { evaluatorOrder: 1, score: 4 },
        { evaluatorOrder: 2, score: 5 },
      ],
    })

    expect(row.secondInterviewScreeningStatus).toBe('completed')
    expect(row.managerAScore).toBe(4)
    expect(row.managerBScore).toBe(5)
    expect(row.totalScore).toBe(9)
  })

  it.each([1, 2, 3, 4] as const)('ST-FIX-06 예비합격 rank %s를 보존한다', reserveRank => {
    const row = mapStatus({
      applicationStatus: 'RESERVE',
      documentStatus: 'DOCUMENT_PASSED',
      interviewStatus: 'EVALUATED',
      finalResultStatus: 'RESERVE',
      reserveRank,
    })

    expect(row.documentScreeningStatus).toBe('pass')
    expect(row.secondInterviewScreeningStatus).toBe(`reserve${reserveRank}`)
  })

  it('ST-FIX-07 활동 포기는 다른 심사 상태보다 우선한다', () => {
    const row = mapStatus({
      applicationStatus: 'GIVE_UP',
      documentStatus: 'DOCUMENT_PASSED',
      interviewStatus: 'ASSIGNED',
      giveUpYn: true,
    })

    expect(row.documentScreeningStatus).toBe('pass')
    expect(row.interviewAssignmentStatus).toBe('withdrawn')
    expect(row.secondInterviewScreeningStatus).toBeUndefined()
  })

  it('ST-FIX-08 기존 Canonical 상태를 계속 읽는다', () => {
    expect(mapStatus({ applicationStatus: 'WAITING_REVIEW' }).documentScreeningStatus).toBe(
      'pending'
    )
    expect(mapStatus({ applicationStatus: 'DOCUMENT_PASSED' }).documentScreeningStatus).toBe(
      'pass'
    )
    expect(
      mapStatus({ applicationStatus: 'INTERVIEW_ASSIGNED' }).interviewAssignmentStatus
    ).toBe('assigned')
    expect(
      mapStatus({
        applicationStatus: 'INTERVIEW_ASSIGNED',
        documentStatus: 'DOCUMENT_PASSED',
        interviewStatus: 'ASSIGNED',
        interviewAssignmentStatus: 'ASSIGNED',
        assignedInterviewStartAt: '2026-11-19T01:00:00Z',
        assignedInterviewEndAt: '2026-11-19T01:30:00Z',
        interviewAssignmentId: 10001,
      }).assignedInterviewEndAt
    ).toBe('2026-11-19T01:30:00Z')
    expect(
      mapStatus({
        interviewAssignmentStatus: 'PARTIALLY_EVALUATED',
        interviewStatus: 'PARTIALLY_EVALUATED',
        documentStatus: 'DOCUMENT_PASSED',
      }).interviewAssignmentStatus
    ).toBe('assigned')
    expect(mapStatus({ applicationStatus: 'FINAL_SELECTED' }).secondInterviewScreeningStatus).toBe(
      'pass'
    )
    expect(
      mapStatus({ applicationStatus: 'RESERVE', reserveRank: 2 }).secondInterviewScreeningStatus
    ).toBe('reserve2')
    expect(mapStatus({ applicationStatus: 'INTERVIEW_FAILED' }).secondInterviewScreeningStatus).toBe(
      'fail'
    )
    expect(mapStatus({ applicationStatus: 'GIVE_UP' }).interviewAssignmentStatus).toBe('withdrawn')
  })
})
