import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { formatRecruitmentHeadcount } from '@/features/program/shared/lib/format-recruitment-headcount'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import {
  COMPANY_SCHOOL_PROGRAM_API_TYPE,
  mapCompanySchoolDetailToProgram,
  mapCompanySchoolListItemToProgram,
  mapCompanySchoolToCreateRequest,
  mapCompanySchoolToUpdateRequest,
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
  it('creates with COMPANY_SCHOOL type', () => {
    const request = mapCompanySchoolToCreateRequest(program)

    expect(request.programType).toBe(COMPANY_SCHOOL_PROGRAM_API_TYPE)
    expect(request.recruitments).toBeUndefined()
    expect(request.startDate).toBe(program.startDate)
    expect(request.endDate).toBe(program.endDate)
    expect(request.businessStartDate).toBe(program.startDate)
    expect(request.businessEndDate).toBe(program.endDate)
    expect(request.generalVolunteers).toBe(0)
    expect(request.autoApplyDefaultFormBindings).toBe(true)
    expect(request.paymentItems).toEqual([
      { itemType: 'TRANSPORTATION', useYn: true },
      { itemType: 'LODGING', useYn: true },
    ])
  })

  it('create 요청에 참여 기관 모집 비고를 remarks로 싣는다', () => {
    const request = mapCompanySchoolToCreateRequest({
      ...program,
      remarks: '테스토 비고',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: { remarks: '테스토 비고' },
      },
    })

    expect((request as { remarks?: string }).remarks).toBe('테스토 비고')
    const overlay = JSON.parse(String(request.serviceDetailJson)).registration?.overlay
    expect(overlay['recruit.notes']).toBe('테스토 비고')
  })

  it('공통정보 패치는 컬럼 targetLevels를 유지하고 모집 라벨로 키우지 않는다', () => {
    const existing: Program = {
      ...program,
      targetLevel: 'elementary',
      targetLevels: ['elementary'],
      generalCommonInfo: {
        ...program.generalCommonInfo,
        announcementTitle: '기존 공고',
        participantRecruitmentInfo: {
          educationTarget: '초등학교, 중학교, 대학(원)생',
        },
      },
    }
    const request = mapCompanySchoolToUpdateRequest(existing, {
      title: '수정된 1사1교',
      generalCommonInfo: { announcementTitle: '수정된 공고' },
    })
    expect(request.targetLevels).toEqual(['elementary'])
    expect(request.targetLevel).toBe('elementary')
  })

  it('등록·수정 사업 기간은 연도를 넘어도 선택한 startDate/endDate를 그대로 보낸다', () => {
    const partial: Program = {
      ...program,
      startDate: '2025-03-31T15:00:00.000Z',
      endDate: '2027-08-23T14:59:59.999Z',
    }
    const created = mapCompanySchoolToCreateRequest(partial)
    const updated = mapCompanySchoolToUpdateRequest(partial, {
      startDate: partial.startDate,
      endDate: partial.endDate,
    })

    expect(created.startDate).toBe(partial.startDate)
    expect(created.endDate).toBe(partial.endDate)
    expect(created.businessStartDate).toBe(partial.startDate)
    expect(created.businessEndDate).toBe(partial.endDate)
    expect(updated.businessStartDate).toBe(partial.startDate)
    expect(updated.businessEndDate).toBe(partial.endDate)
  })

  it('상세 운영 기간은 GET 서울 달력일을 쓴다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186100',
      startDate: '2026-11-22',
      endDate: '2026-12-23',
      businessStartDate: '2026-11-22',
      businessEndDate: '2026-12-23',
      rounds: [
        {
          roundNumber: 1,
          startDate: '2026-11-22',
          endDate: '2026-12-23',
          status: 'active',
        },
      ],
    } as ProgramResponse)

    expect(mapped.startDate).toBe('2026-11-22')
    expect(mapped.endDate).toBe('2026-12-23')
    expect(mapped.rounds[0]?.startDate).toBe('2026-11-22')
    expect(mapped.rounds[0]?.endDate).toBe('2026-12-23')
    expect(mapped.backendProgramType).toBe('COMPANY_SCHOOL')
  })

  it('maps createdByName and updatedByName from detail JSON', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186016',
      title: '1사1교',
      createdByName: '곽도규',
      updatedByName: '김도영',
    } as ProgramResponse)

    expect(mapped.createdByName).toBe('곽도규')
    expect(mapped.updatedByName).toBe('김도영')
  })

  it('serviceDetailJson paymentItems가 id 배열이어도 상세 매핑이 깨지지 않는다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186016',
      title: '수정테스트용 1사1교',
      mainTitle: '수정테스트용 1사1교',
      createdAt: '2026-09-28T23:45:39.709Z',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            paymentItems: ['p-166202', 'p-166204'],
            detailedProgramName: '1사1교 경제금융교육',
          },
        },
      }),
    } as ProgramResponse)

    expect(mapped.title).toBe('수정테스트용 1사1교')
    expect(mapped.createdAt).toBe('2026-09-28T23:45:39.709Z')
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('1사1교 경제금융교육')
    expect(typeof mapped.generalCommonInfo?.paymentItems).toBe('string')
    expect(mapped.generalCommonInfo?.paymentItems).toContain('p-166202')
  })

  it('settlementPolicy.paymentItems가 있으면 JSON 라벨보다 구조화 항목을 우선한다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186016',
      title: '수정테스트용 1사1교',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            paymentItems: ['p-166202', 'p-166204'],
          },
        },
      }),
      settlementPolicy: {
        paymentItems: [{ itemType: 'TRANSPORTATION', useYn: true }],
      },
    } as ProgramResponse)

    expect(mapped.generalCommonInfo?.paymentItems).toBe('교통비')
  })

  it('상세 응답의 businessField alias도 사업 분야로 읽는다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '1',
      title: '1사1교 프로그램',
      businessField: 'digital_literacy',
    } as ProgramResponse & { businessField?: string })

    expect(mapped.businessArea).toBe('디지털리터러시')
  })

  it('GET educationScheduleMode period는 date로 바꾸지 않고, 키가 없으면 date를 심지 않는다', () => {
    const withPeriod = mapCompanySchoolDetailToProgram({
      id: '186100',
      title: '1사1교',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            educationScheduleMode: 'period',
            educationScheduleLines: ['2026.11.22 ~ 2026.12.23'],
          },
        },
      }),
    } as ProgramResponse)
    expect(withPeriod.generalCommonInfo?.educationScheduleMode).toBe('period')

    const withoutMode = mapCompanySchoolDetailToProgram({
      id: '186100',
      title: '1사1교',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: { generalCommonInfo: { educationScheduleLines: [] } },
      }),
    } as ProgramResponse)
    expect(withoutMode.generalCommonInfo?.educationScheduleMode).toBeUndefined()
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
            deductionItems: '원천징수세액',
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
    expect(mapped.generalCommonInfo?.paymentItems).toBe('교통비')
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
          deductionItems: '원천징수세액',
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
    expect(mapped.generalCommonInfo?.paymentItems).toBe('교통비, 장거리 교통비, 숙박비')
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
          deductionItems: '원천징수세액',
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
    expect(mapped.generalCommonInfo?.paymentItems).toBe('교통비, 장거리 교통비, 숙박비')
  })

  it('Create는 숙박비·장거리 교통비를 paymentItems로 보낸다', () => {
    const request = mapCompanySchoolToCreateRequest({
      ...program,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        paymentItems: '숙박비, 장거리 교통비, 식사비',
      },
    })
    expect(request.paymentItems).toEqual([
      { itemType: 'LODGING', useYn: true },
      { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
      { itemType: 'MEAL', useYn: true },
    ])
  })

  it('지급 항목 외 PATCH는 상위 paymentItems를 omit한다', () => {
    const request = mapCompanySchoolToUpdateRequest(program, { title: '제목만' })
    expect(request).not.toHaveProperty('paymentItems')
  })

  it('전체 지급 항목 해제는 paymentItems: []를 보낸다', () => {
    const request = mapCompanySchoolToUpdateRequest(program, {
      generalCommonInfo: { paymentItems: '해당없음' },
    })
    expect(request.paymentItems).toEqual([])
  })

  it('settlementPolicy.paymentItems []는 JSON overlay 지급 항목을 덮어 빈 상태로 둔다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186014',
      title: '기업가정신 스타트업 체험',
      serviceDetailJson: JSON.stringify({
        generalCommonInfo: { paymentItems: '숙박비(일사일교)' },
      }),
      settlementPolicy: { paymentItems: [] },
    } as ProgramResponse)
    expect(mapped.generalCommonInfo?.paymentItems).toBeUndefined()
  })

  it('round-trips school, instructor, wage and payment details without volunteers', () => {
    const raw = serializeCompanySchoolServiceDetailJson(program)
    const parsed = parseCompanySchoolServiceDetailJson(raw)

    expect(parsed.generalParticipantTypes).toEqual(['school_institution', 'teacher_instructor'])
    expect(parsed.generalCommonInfo?.wageGradeRows).toEqual(
      program.generalCommonInfo?.wageGradeRows
    )
    expect(parsed.generalCommonInfo?.paymentItems).toBe(program.generalCommonInfo?.paymentItems)
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
      serviceDetailJson: updateRequest.serviceDetailJson ?? undefined,
    })

    expect(detail.generalParticipantTypes).toEqual(['school_institution', 'teacher_instructor'])
    expect(detail.generalCommonInfo?.paymentItems).toBe(program.generalCommonInfo?.paymentItems)
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
    const withPersistedRound = mapCompanySchoolToUpdateRequest({
      ...withContact,
      rounds: [{ ...withContact.rounds[0], id: '186592' }],
    })
    expect(withPersistedRound.rounds?.[0]?.id).toBe('186592')
    const fromGet = mapCompanySchoolDetailToProgram({
      id: '186551',
      title: withContact.title,
      rounds: [
        {
          id: '187700',
          roundNumber: 1,
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T23:59:59.999Z',
          status: 'active',
        },
      ],
    } as ProgramResponse)
    expect(fromGet.rounds[0]?.id).toBe('187700')
    expect(mapCompanySchoolToUpdateRequest(fromGet).rounds?.[0]?.id).toBe('187700')
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

  it('사업 분야는 공식 businessArea만 생성·수정 요청에 보낸다', () => {
    const changed = { ...program, businessArea: 'digital_literacy' }
    const create = mapCompanySchoolToCreateRequest(changed)
    const update = mapCompanySchoolToUpdateRequest(changed, {
      businessArea: 'digital_literacy',
    })

    expect(create.businessArea).toBe('디지털리터러시')
    expect(create).not.toHaveProperty('businessField')
    expect(update.businessArea).toBe('디지털리터러시')
    expect(update).not.toHaveProperty('businessField')
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
          recruitmentPeriodLabel: '2026.10.03 ~ 2026.10.07',
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

  it('participant recruitment patch keeps participantRecruitmentInfo in serviceDetailJson', () => {
    const withRecruitment: Program = {
      ...program,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: {
          contactOrganizationName: '구 문의처',
          educationTargetDetail: '구 대상',
        },
        instructorRecruitmentInfo: { recruitmentTarget: '성인' },
        volunteerRecruitmentInfo: { recruitmentTarget: '일반인' },
      },
    }
    const request = mapCompanySchoolToUpdateRequest(withRecruitment, {
      applicationStartDate: '2026-10-03T00:00:00.000Z',
      applicationEndDate: '2026-10-07T00:00:00.000Z',
      generalCommonInfo: {
        educationScheduleMode: 'period',
        participantRecruitmentInfo: {
          contactOrganizationName: '새 문의처',
          educationTargetDetail: '중학생',
        },
      },
    })

    const parsed = JSON.parse(request.serviceDetailJson!) as {
      program?: {
        generalCommonInfo?: {
          participantRecruitmentInfo?: {
            contactOrganizationName?: string
            educationTargetDetail?: string
          }
          instructorRecruitmentInfo?: unknown
          volunteerRecruitmentInfo?: unknown
        }
      }
    }
    expect(parsed.program?.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      contactOrganizationName: '새 문의처',
      educationTargetDetail: '중학생',
    })
    expect(parsed.program?.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
    expect(parsed.program?.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()
  })

  it('instructor recruitment patch keeps instructorRecruitmentInfo in serviceDetailJson', () => {
    const withRecruitment: Program = {
      ...program,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: { contactOrganizationName: '학교 문의' },
        instructorRecruitmentInfo: { contactOrganizationName: '구 강사 문의' },
      },
    }
    const request = mapCompanySchoolToUpdateRequest(withRecruitment, {
      instructorApplicationStartDate: '2026-10-03T00:00:00.000Z',
      instructorApplicationEndDate: '2026-10-07T00:00:00.000Z',
      generalCommonInfo: {
        instructorRecruitmentInfo: { contactOrganizationName: '새 강사 문의' },
      },
    })

    const parsed = JSON.parse(request.serviceDetailJson!) as {
      program?: {
        generalCommonInfo?: {
          participantRecruitmentInfo?: unknown
          instructorRecruitmentInfo?: { contactOrganizationName?: string }
        }
      }
    }
    expect(parsed.program?.generalCommonInfo?.instructorRecruitmentInfo).toEqual({
      contactOrganizationName: '새 강사 문의',
    })
    expect(parsed.program?.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
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
          recruitmentPeriodLabel: '2026.10.03 ~ 2026.10.07',
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

  it('공통정보 담당자 id를 sponsors[] 배정으로 보낸다', () => {
    const withContact: Program = {
      ...program,
      sponsorId: '163388',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        sponsorManagementIds: ['163388'],
        sponsorManagerContactIds: ['1627253'],
      },
    }
    const request = mapCompanySchoolToUpdateRequest(withContact, {
      sponsorId: '163388',
      generalCommonInfo: withContact.generalCommonInfo,
    })

    expect(request.sponsorId).toBe('163388')
    expect(request.sponsors).toEqual([{ sponsorId: '163388', sponsorContactId: '1627253' }])
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
    expect(request.sponsors).toEqual([{ sponsorId: '1627251' }])
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

  it('목록 참여자 모집 인원 분모는 서버 participantCapacity를 그대로 표시한다', () => {
    const mapped = mapCompanySchoolListItemToProgram({
      id: 186545,
      title: '1사1교',
      participantApprovedCount: 0,
      participantCapacity: 36,
    })
    expect(
      formatRecruitmentHeadcount(mapped.participantApprovedCount, mapped.participantCapacity)
    ).toBe('0 / 36')
  })

  it('목록 participantCapacity가 null이면 분모는 -로 표시한다', () => {
    const mapped = mapCompanySchoolListItemToProgram({
      id: 186317,
      title: '1사1교',
      participantApprovedCount: 5,
      participantCapacity: null,
      participantRecruitmentCount: null,
    })
    expect(
      formatRecruitmentHeadcount(mapped.participantApprovedCount, mapped.participantCapacity)
    ).toBe('5 / -')
  })

  it('모집 패치의 applicationMethod·remarks만 컬럼으로 보내고 otherNotes와 섞지 않는다', () => {
    const existing: Program = {
      ...program,
      applicationMethod: '방문 접수',
      remarks: '기존 비고',
      otherNotes: '기존 기타',
    }
    const sent = mapCompanySchoolToUpdateRequest(existing, {
      applicationMethod: '온라인 신청',
      remarks: '수정 비고',
    })
    expect(sent.applicationMethod).toBe('온라인 신청')
    expect(sent.remarks).toBe('수정 비고')
    expect(sent.otherMatters).toBeUndefined()

    const untouched = mapCompanySchoolToUpdateRequest(existing, { title: '제목만' })
    expect(untouched.applicationMethod).toBeUndefined()
    expect(untouched.remarks).toBeUndefined()

    const otherOnly = mapCompanySchoolToUpdateRequest(existing, { otherNotes: '기타만' })
    expect(otherOnly.remarks).toBeUndefined()
    expect(otherOnly.otherMatters).toBe('기타만')
  })

  it('지원 방법·비고를 비우면 clearFields에만 싣는다', () => {
    const existing: Program = {
      ...program,
      applicationMethod: '방문 접수',
      remarks: '기존 비고',
    }
    const request = mapCompanySchoolToUpdateRequest(existing, {
      applicationMethod: '',
      remarks: undefined,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        participantRecruitmentInfo: { remarks: undefined },
      },
    })
    expect(request.applicationMethod).toBeUndefined()
    expect(request.remarks).toBeUndefined()
    expect(request.clearFields).toEqual(expect.arrayContaining(['applicationMethod', 'remarks']))
  })

  it('참여 모집 탭 중첩 문의처·지원방법만 바뀌면 최상위 contactName·applicationMethod도 보낸다 (QA #9·#12)', () => {
    const existing: Program = {
      ...program,
      contactName: '기존 문의처',
      applicationMethod: '<p>기존 지원방법</p>',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: {
          contactOrganizationName: '기존 문의처',
          applicationMethod: '<p>기존 지원방법</p>',
        },
      },
    }
    const request = mapCompanySchoolToUpdateRequest(existing, {
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        participantRecruitmentInfo: {
          contactOrganizationName: '새 문의처',
          contactName: '새 문의처',
          applicationMethod: '<p>새 지원방법</p>',
        },
      },
    })
    expect(request.contactName).toBe('새 문의처')
    expect(request.applicationMethod).toBe('<p>새 지원방법</p>')

    const unchanged = mapCompanySchoolToUpdateRequest(existing, {
      generalCommonInfo: existing.generalCommonInfo,
    })
    expect(unchanged.contactName).toBeUndefined()
    expect(unchanged.applicationMethod).toBeUndefined()

    const blanked = mapCompanySchoolToUpdateRequest(existing, {
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        participantRecruitmentInfo: { contactOrganizationName: '', applicationMethod: '' },
      },
    })
    expect(blanked.contactName).toBeUndefined()
    expect(blanked.clearFields ?? []).not.toContain('contactName')
  })
})

describe('1사1교 serviceDetailJson nested overlay 정본', () => {
  it('legacy root-only JSON은 읽지 않는다(루트 fallback 제거)', () => {
    const parsed = parseCompanySchoolServiceDetailJson(
      JSON.stringify({
        schemaVersion: 1,
        program: { title: '1사1교' },
        registrationOverlay: {
          'economyRegistration.basicInfo.publicProgramTitle': '구버전 공고명',
          'economyRegistration.wageInfo.paymentItemValues': ['p-1'],
        },
      })
    )
    expect(parsed.registrationOverlay).toBeUndefined()
  })

  it('저장 JSON에 루트 registrationOverlay가 없다', () => {
    const loaded: Program = {
      ...program,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        announcementTitle: '중첩 공고명',
      },
      registrationOverlay: {
        'economyRegistration.basicInfo.publicProgramTitle': '중첩 공고명',
        'economyRegistration.wageInfo.paymentItemValues': ['p-keep'],
        'recruit.notes': '모집 문구',
      },
    }
    const json = serializeCompanySchoolServiceDetailJson(loaded)
    const raw = JSON.parse(json) as {
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(raw).not.toHaveProperty('registrationOverlay')
    expect(raw.registration?.overlay).toBeTruthy()
  })

  it('지급 항목 overlay를 바꿔도 공고 제목 nested가 유실되지 않는다', () => {
    const json = serializeCompanySchoolServiceDetailJson({
      ...program,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        announcementTitle: '유지 공고명',
      },
      registrationOverlay: {
        'economyRegistration.basicInfo.publicProgramTitle': '유지 공고명',
        'economyRegistration.wageInfo.paymentItemValues': ['p-only'],
      },
    })
    const overlay = (JSON.parse(json) as { registration?: { overlay?: Record<string, unknown> } })
      .registration?.overlay
    expect(overlay?.['economyRegistration.basicInfo.publicProgramTitle']).toBe('유지 공고명')
    expect(json).not.toContain('"registrationOverlay"')
  })

  it('빈 배열 overlay는 조회 시 기본 배열을 발명하지 않는다', () => {
    const parsed = parseCompanySchoolServiceDetailJson(
      JSON.stringify({
        schemaVersion: 1,
        program: { title: '1사1교' },
        registration: {
          overlay: {
            'economyRegistration.wageInfo.paymentItemValues': [],
          },
        },
      })
    )
    expect(parsed.registrationOverlay?.['economyRegistration.wageInfo.paymentItemValues']).toEqual(
      []
    )
  })
})
