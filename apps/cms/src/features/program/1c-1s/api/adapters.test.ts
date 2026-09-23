import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import {
  COMPANY_SCHOOL_PROGRAM_API_TYPE,
  mapCompanySchoolDetailToProgram,
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
  it('creates with COMPANY_SCHOOL type and business period from 사업 운영 기간', () => {
    const request = mapCompanySchoolToCreateRequest(program)

    expect(request.programType).toBe(COMPANY_SCHOOL_PROGRAM_API_TYPE)
    expect(request.businessStartDate).toBe(program.startDate)
    expect(request.businessEndDate).toBe(program.endDate)
    expect(request.generalVolunteers).toBe(0)
    expect(request.autoApplyDefaultFormBindings).toBe(true)
  })

  it('등록·수정 사업 기간은 선택한 start/end를 businessStartDate/EndDate로 보낸다', () => {
    const partial: Program = {
      ...program,
      startDate: '2026-11-26T15:00:00.000Z',
      endDate: '2026-12-08T15:00:00.000Z',
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

  it('상세 사업 기간은 businessStartDate/EndDate를 쓴다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186100',
      startDate: '2026-10-21',
      endDate: '2026-11-01',
      businessStartDate: '2026-10-14',
      businessEndDate: '2026-11-07',
    } as ProgramResponse)

    expect(mapped.startDate).toBe('2026-10-14')
    expect(mapped.endDate).toBe('2026-11-07')
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
})
