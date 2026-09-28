import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import {
  COMPANY_SCHOOL_PROGRAM_API_TYPE,
  mapCompanySchoolDetailToProgram,
  mapCompanySchoolListItemToProgram,
  mapCompanySchoolToCreateRequest,
  mapCompanySchoolToUpdateRequest,
  resolveCompanySchoolBusinessCalendarYearPeriod,
} from './adapters'
import {
  parseCompanySchoolServiceDetailJson,
  serializeCompanySchoolServiceDetailJson,
} from './service-detail-json'

const program: Program = {
  id: 'company-school-1',
  sponsorId: 'sponsor-1',
  title: '2026 1사1교',
  mainTitle: '2026 1사1교',
  type: 'offline',
  format: 'workshop',
  category: 'school',
  description: '학교와 강사를 모집하는 1년 프로그램',
  rounds: [
    {
      id: 'round-1',
      programId: 'company-school-1',
      roundNumber: 1,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.999Z',
      status: 'active',
    },
  ],
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T23:59:59.999Z',
  applicationStartDate: '2026-01-01T00:00:00.000Z',
  applicationEndDate: '2026-12-31T23:59:59.999Z',
  instructorApplicationStartDate: '2026-01-01T00:00:00.000Z',
  instructorApplicationEndDate: '2026-12-31T23:59:59.999Z',
  status: 'pending',
  lifecycleStatus: 'recruiting_students',
  generalParticipantTypes: ['school_institution', 'teacher_instructor'],
  generalCommonInfo: {
    educationScheduleMode: 'period',
    wageGradeRows: [{ grade: '1급 강사비', pricing: '기본 500,000원' }],
    paymentItems: '교통비(일사일교), 숙박비(일사일교)',
  },
  studentListRequired: 'not_required',
  instructorCapacity: 30,
  participatingSchoolCount: 10,
  participatingStudentCount: 300,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('company-school adapters', () => {
  it('creates with COMPANY_SCHOOL type and calendar-year business period', () => {
    const request = mapCompanySchoolToCreateRequest(program)
    const year = resolveCompanySchoolBusinessCalendarYearPeriod(program)

    expect(request.programType).toBe(COMPANY_SCHOOL_PROGRAM_API_TYPE)
    expect(request.startDate).toBe(program.startDate)
    expect(request.endDate).toBe(program.endDate)
    expect(request.businessStartDate).toBe(year.start)
    expect(request.businessEndDate).toBe(year.end)
    expect(request.generalVolunteers).toBe(0)
    expect(request.autoApplyDefaultFormBindings).toBe(true)
  })

  it('등록·수정 사업 기간은 달력연도(1/1~12/31, Seoul)를 businessStartDate/EndDate로 보낸다', () => {
    const partial: Program = {
      ...program,
      startDate: '2026-11-25T15:00:00.000Z',
      endDate: '2026-12-17T14:59:59.999Z',
    }
    const year = resolveCompanySchoolBusinessCalendarYearPeriod(partial)
    const created = mapCompanySchoolToCreateRequest(partial)
    const updated = mapCompanySchoolToUpdateRequest(partial, {
      startDate: partial.startDate,
      endDate: partial.endDate,
    })

    expect(created.startDate).toBe(partial.startDate)
    expect(created.endDate).toBe(partial.endDate)
    expect(created.businessStartDate).toBe(year.start)
    expect(created.businessEndDate).toBe(year.end)
    expect(updated.businessStartDate).toBe(year.start)
    expect(updated.businessEndDate).toBe(year.end)
    expect(year.start).toBe('2025-12-31T15:00:00.000Z')
    expect(year.end).toBe('2026-12-31T14:59:59.999Z')
  })

  it('상세 운영 기간은 startDate/endDate를 쓰고 business(달력연도)로 덮지 않는다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186100',
      startDate: '2026-10-21',
      endDate: '2026-11-01',
      businessStartDate: '2026-01-01',
      businessEndDate: '2026-12-31',
    } as ProgramResponse)

    expect(mapped.startDate).toBe('2026-10-21')
    expect(mapped.endDate).toBe('2026-11-01')
    expect(mapped.backendProgramType).toBe('COMPANY_SCHOOL')
  })

  it('상세 임금은 serviceDetailJson wageGradeRows를 쓰고 settlementPolicy 기본값으로 덮지 않는다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186200',
      title: '1사1교 임금 조회',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            wageGradeRows: [
              { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 120,000원 | 장거리 : 60,000원' },
            ],
            paymentItems: 'p-166201, p-166202',
            deductionItems: '일용근로자 원천징수세액',
          },
        },
      }),
      settlementPolicy: {
        wagePolicies: [
          { feeGrade: 'GRADE_1', feeKind: 'NORMAL', amount: 500000 },
          { feeGrade: 'GRADE_1', feeKind: 'LONG_DISTANCE', amount: 500000 },
        ],
        paymentItems: [{ itemType: 'TRANSPORTATION', useYn: true }],
      },
    } as ProgramResponse)

    expect(mapped.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('120,000원')
    expect(mapped.generalCommonInfo?.paymentItems).toBe('p-166201, p-166202')
  })

  it('186014처럼 object serviceDetailJson + 루트 generalCommonInfo(임금 없음)여도 program 쪽 임금을 쓴다', () => {
    const dualEnvelope = {
      schemaVersion: 1,
      program: {
        generalCommonInfo: {
          wageGradeRows: [
            { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 170,000원 | 장거리 : 30,000원' },
            { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 150,000원 | 장거리 : 20,000원' },
            { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 130,000원 | 장거리 : 10,000원' },
          ],
          paymentItems: '교통비(일사일교), 숙박비(일사일교)',
          deductionItems: '일용근로자 원천징수세액',
        },
      },
      generalCommonInfo: {
        title: '기업가정신 스타트업 체험',
        sponsorId: '163384',
      },
    }

    const mapped = mapCompanySchoolDetailToProgram({
      id: '186014',
      title: '기업가정신 스타트업 체험',
      serviceDetailJson: dualEnvelope as unknown as string,
      settlementPolicy: {
        wagePolicies: [
          { feeGrade: 'GRADE_1', feeKind: 'NORMAL', amount: 500000, maxAmount: 500000 },
          { feeGrade: 'GRADE_1', feeKind: 'LONG_DISTANCE', amount: 500000, maxAmount: 500000 },
          { feeGrade: 'GRADE_2', feeKind: 'NORMAL', amount: 400000, maxAmount: 400000 },
          { feeGrade: 'GRADE_2', feeKind: 'LONG_DISTANCE', amount: 400000, maxAmount: 400000 },
          { feeGrade: 'GRADE_3', feeKind: 'NORMAL', amount: 300000, maxAmount: 300000 },
          { feeGrade: 'GRADE_3', feeKind: 'LONG_DISTANCE', amount: 300000, maxAmount: 300000 },
        ],
        paymentItems: [
          { itemType: 'TRANSPORTATION', useYn: true },
          { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
          { itemType: 'LODGING', useYn: true },
        ],
      },
    } as ProgramResponse)

    expect(mapped.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('170,000원')
    expect(mapped.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('30,000원')
    expect(mapped.generalCommonInfo?.paymentItems).toBe('교통비(일사일교), 숙박비(일사일교)')
    expect(mapped.generalCommonInfo?.paymentItems).not.toContain('LONG_DISTANCE')
    expect(mapped.generalCommonInfo?.wageGradeRows?.[0]?.pricing).not.toContain('500,000')
  })

  it('186014 string serviceDetailJson + 루트 generalCommonInfo여도 program 쪽 임금을 쓴다', () => {
    const dualEnvelope = {
      schemaVersion: 1,
      program: {
        generalCommonInfo: {
          wageGradeRows: [
            { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 170,000원 | 장거리 : 30,000원' },
          ],
          paymentItems: '교통비(일사일교), 숙박비(일사일교)',
          deductionItems: '일용근로자 원천징수세액',
        },
      },
      generalCommonInfo: {
        title: '기업가정신 스타트업 체험',
      },
    }

    const mapped = mapCompanySchoolDetailToProgram({
      id: '186014',
      title: '기업가정신 스타트업 체험',
      serviceDetailJson: JSON.stringify(dualEnvelope),
      settlementPolicy: {
        wagePolicies: [
          { feeGrade: 'GRADE_1', feeKind: 'NORMAL', amount: 500000, maxAmount: 500000 },
          { feeGrade: 'GRADE_1', feeKind: 'LONG_DISTANCE', amount: 500000, maxAmount: 500000 },
        ],
        paymentItems: [
          { itemType: 'TRANSPORTATION', useYn: true },
          { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
          { itemType: 'LODGING', useYn: true },
        ],
      },
    } as ProgramResponse)

    expect(mapped.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('170,000원')
    expect(mapped.generalCommonInfo?.paymentItems).toBe('교통비(일사일교), 숙박비(일사일교)')
  })

  it('round-trips school, instructor, wage and payment details without volunteers', () => {
    const raw = serializeCompanySchoolServiceDetailJson(program)
    const parsed = parseCompanySchoolServiceDetailJson(raw)

    expect(parsed.generalParticipantTypes).toEqual([
      'school_institution',
      'teacher_instructor',
    ])
    expect(parsed.generalCommonInfo?.wageGradeRows).toEqual(
      program.generalCommonInfo?.wageGradeRows
    )
    expect(parsed.generalCommonInfo?.paymentItems).toBe(
      program.generalCommonInfo?.paymentItems
    )
    expect(parsed.volunteerApplicationStartDate).toBeUndefined()
    expect(parsed.generalVolunteers).toBe(0)
  })

  it('maps API detail and update through the company-school payload', () => {
    const updateRequest = mapCompanySchoolToUpdateRequest(program)
    const detail = mapCompanySchoolDetailToProgram({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      status: program.status,
      serviceDetailJson: updateRequest.serviceDetailJson,
    })

    expect(detail.generalParticipantTypes).toEqual([
      'school_institution',
      'teacher_instructor',
    ])
    expect(detail.generalCommonInfo?.paymentItems).toBe(
      program.generalCommonInfo?.paymentItems
    )
    expect(detail.generalVolunteers).toBe(0)
  })

  it('full update without patch still includes core fields', () => {
    const withContact: Program = {
      ...program,
      managerName: '홍길동',
      contactPhone: '010-1234-5678',
      curriculum: 'company-school-curriculum',
    }
    const request = mapCompanySchoolToUpdateRequest(withContact)

    expect(request.title).toBe(withContact.title)
    expect(request.rounds).toEqual([
      {
        roundNumber: 1,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.999Z',
        capacity: undefined,
        classCount: undefined,
        status: 'active',
        curriculum: undefined,
        deliveryType: undefined,
      },
    ])
    expect(request.managerName).toBe('홍길동')
    expect(request.contactPhone).toBe('010-1234-5678')
    expect(request.curriculum).toBe('company-school-curriculum')
    expect(request.serviceDetailJson).toBeTruthy()
    expect(request.generalVolunteers).toBe(0)
  })

  it('maps Program patch to update request with only patched keys', () => {
    const request = mapCompanySchoolToUpdateRequest(program, {
      title: '수정된 제목',
      mainTitle: '수정된 대표명',
    })

    expect(request.title).toBe('수정된 제목')
    expect(request.mainTitle).toBe('수정된 대표명')
    expect(request.rounds).toBeUndefined()
    expect(request.managerName).toBeUndefined()
    expect(request.contactPhone).toBeUndefined()
    expect(request.curriculum).toBeUndefined()
    expect(request.serviceDetailJson).toBeUndefined()
  })

  it('omits masked manager/contact from patch update request', () => {
    const request = mapCompanySchoolToUpdateRequest(program, {
      managerName: '김*원',
      contactPhone: '010-****-7253',
      contactEmail: 'ab***@example.com',
      mainTitle: '제목만',
    })

    expect(request.mainTitle).toBe('제목만')
    expect(request.managerName).toBeUndefined()
    expect(request.contactPhone).toBeUndefined()
    expect(request.contactEmail).toBeUndefined()
  })

  it('common-info patch omits participant recruitment from serviceDetailJson', () => {
    const withRecruitment: Program = {
      ...program,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: {
          recruitmentPeriodLabel: '2026. 10. 03 ~ 2026. 10. 07',
          contactOrganizationName: '담당자',
        },
        instructorRecruitmentInfo: {
          recruitmentTarget: '성인',
        },
        volunteerRecruitmentInfo: {
          recruitmentTarget: '일반인',
        },
      },
    }
    const request = mapCompanySchoolToUpdateRequest(withRecruitment, {
      mainTitle: '공통정보만',
      generalCommonInfo: {
        educationScheduleMode: 'period',
        wageGradeRows: [{ grade: '1급 강사비', pricing: '기본 140,000원' }],
      },
    })

    expect(request.mainTitle).toBe('공통정보만')
    expect(request.serviceDetailJson).toBeTruthy()
    const parsed = JSON.parse(request.serviceDetailJson!) as {
      program?: {
        generalCommonInfo?: Record<string, unknown>
        studentListRequired?: string
        resultAnnouncementDate?: string
      }
      registration?: unknown
    }
    expect(parsed.program?.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
    expect(parsed.program?.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
    expect(parsed.program?.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()
    expect(parsed.program?.generalCommonInfo?.wageGradeRows).toBeTruthy()
    expect(parsed.program?.studentListRequired).toBeUndefined()
    expect(parsed.program?.resultAnnouncementDate).toBeUndefined()
    expect(parsed.registration).toBeUndefined()
  })

  it('title-only common-info patch does not resend recruitment or registration overlay', () => {
    const loaded: Program = {
      ...program,
      studentListRequired: 'required',
      resultAnnouncementDate: '2026-10-06T15:00:00.000Z',
      registrationOverlay: {
        'economyRegistration.basicInfo.repKo': '등록 제목',
        'economyRegistration.wageInfo.paymentItemValues': ['p-166201'],
      },
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: {
          recruitmentPeriodLabel: '2026. 10. 03 ~ 2026. 10. 07',
          preEducationNoticeRequired: true,
        },
      },
    }
    const request = mapCompanySchoolToUpdateRequest(loaded, {
      title: '우리 동네 소비와 저축11',
      mainTitle: '우리 동네 소비와 저축11',
    })

    expect(request.title).toBe('우리 동네 소비와 저축11')
    expect(request.applicationStartDate).toBeUndefined()
    expect(request.serviceDetailJson).toBeUndefined()
    expect(request.rounds).toBeUndefined()
  })

  it('common-info patch with registrationOverlay persists overlay in serviceDetailJson', () => {
    const overlay = {
      'economyRegistration.basicInfo.repKo': '디지털 리터러시 교실',
      'economyRegistration.wageInfo.paymentItemValues': ['p-166201'],
    }
    const request = mapCompanySchoolToUpdateRequest(program, {
      title: '디지털 리터러시 교실',
      mainTitle: '디지털 리터러시 교실',
      generalCommonInfo: program.generalCommonInfo,
      registrationOverlay: overlay,
    })

    expect(request.serviceDetailJson).toBeTruthy()
    const parsed = JSON.parse(request.serviceDetailJson ?? '{}') as {
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(parsed.registration?.overlay?.['economyRegistration.basicInfo.repKo']).toBe(
      '디지털 리터러시 교실'
    )
  })

  it('common-info style patch does not dump rounds or masked manager fields', () => {
    const withNoise: Program = {
      ...program,
      managerName: '김*원',
      contactPhone: '010-****-7253',
      curriculum: 'payment-orders-catalog-v1',
      oneLineIntroduction: 'should-not-send',
      rounds: program.rounds,
    }
    const request = mapCompanySchoolToUpdateRequest(withNoise, {
      mainTitle: '공통정보만',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      sponsorId: '1627251',
      generalCommonInfo: {
        educationScheduleMode: 'period',
        wageGradeRows: [{ grade: '1급 강사비', pricing: '기본 500,000원' }],
        paymentItems: '교통비(일사일교), 숙박비(일사일교)',
      },
    })

    expect(request.mainTitle).toBe('공통정보만')
    expect(request.sponsorId).toBe('1627251')
    expect(typeof request.sponsorId).toBe('string')
    expect(request.serviceDetailJson).toContain('paymentItems')
    expect(request.rounds).toBeUndefined()
    expect(request.managerName).toBeUndefined()
    expect(request.contactPhone).toBeUndefined()
    expect(request.curriculum).toBeUndefined()
    expect(request.oneLineIntroduction).toBeUndefined()
  })

  it('세부 프로그램명 — detailedProgramId(숫자 마스터 id)로 보내고, textbookName엔 복제하지 않는다 (버그 수정 확인)', () => {
    // 일반 프로그램 어댑터와 동일한 계약: 세부 프로그램명은 detailedProgramId(top-level, 숫자)로
    // 전송하고, textbookName(교재명)은 별개 필드이므로 detailedProgramName과 같은 값이면 omit한다.
    const withDetailedProgramName: Program = {
      ...program,
      detailedProgramId: '163010',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        detailedProgramName: '실제 선택한 세부 프로그램명',
      },
    }

    const createRequest = mapCompanySchoolToCreateRequest(withDetailedProgramName)
    expect(createRequest.detailedProgramId).toBe(163010)
    expect(createRequest.textbookName).toBeUndefined()

    const fullUpdateRequest = mapCompanySchoolToUpdateRequest(withDetailedProgramName)
    expect(fullUpdateRequest.detailedProgramId).toBe(163010)
    expect(fullUpdateRequest.textbookName).toBeUndefined()

    const patchRequest = mapCompanySchoolToUpdateRequest(withDetailedProgramName, {
      detailedProgramId: withDetailedProgramName.detailedProgramId,
      generalCommonInfo: withDetailedProgramName.generalCommonInfo,
    })
    expect(patchRequest.detailedProgramId).toBe(163010)

    // textbookName이 detailedProgramName과 무관한 실제 교재명이면 그대로 보존된다.
    const withRealTextbookName: Program = {
      ...program,
      detailedProgramId: '163010',
      textbookName: '진짜 교재명',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        detailedProgramName: '실제 선택한 세부 프로그램명',
      },
    }
    const requestWithRealTextbook = mapCompanySchoolToCreateRequest(withRealTextbookName)
    expect(requestWithRealTextbook.detailedProgramId).toBe(163010)
    expect(requestWithRealTextbook.textbookName).toBe('진짜 교재명')
  })

  it('maps typed lifecycleStatus from detail and ignores serviceDetailJson lifecycle', () => {
    const detail = mapCompanySchoolDetailToProgram({
      id: '170002',
      title: 'ONE-02',
      status: 'active',
      lifecycleStatus: 'in_progress',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: { lifecycleStatus: 'education_completed' },
      }),
    })
    expect(detail.lifecycleStatus).toBe('in_progress')
    expect(detail.status).toBe('active')
  })

  it('목록은 관리명(title)을 유지하고 대표명(mainTitle)·titleEn을 그대로 둔다', () => {
    const mapped = mapCompanySchoolListItemToProgram({
      id: 170010,
      title: '생성 당시명',
      mainTitle: '수정1',
      titleEn: 'Revised',
    })
    expect(mapped.title).toBe('생성 당시명')
    expect(mapped.mainTitle).toBe('수정1')
    expect(mapped.titleEn).toBe('Revised')
  })

  it('목록 참여자 모집 인원은 승인 건수와 정원만 매핑한다', () => {
    const mapped = mapCompanySchoolListItemToProgram({
      id: 170001,
      title: '1사1교',
      participantApprovedCount: 3,
      participantCapacity: null,
      applicantCount: 20,
      instructorApplicantCount: 8,
      organizationApplicationCount: 11,
    })
    expect(mapped.participantApprovedCount).toBe(3)
    expect(mapped.participantCapacity).toBeUndefined()
  })
})
