import { describe, expect, it } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'
import { buildUjatProgramListRowFromRegistrationSnapshot } from '@/features/program/ujat/lib/ujat-registration-local-save'
import { fromDetail, fromListItem, toCreateRequest, toUpdateRequest } from './adapters'
import { shouldRetryQuery } from './errors'
import { toRemoteListParams } from './list-params'
import { parseRegistrationSnapshot } from './service-detail'

const program: Program = {
  id: 'ujat-1',
  sponsorId: 'sponsor-1',
  title: '2026 UJAT',
  type: 'offline',
  format: 'course',
  category: 'school',
  rounds: [],
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T23:59:59.999Z',
  status: 'active',
  lifecycleStatus: 'planned',
  ujatProgressStatus: 'VOLUNTEER_RECRUITING',
  ujatFirstHalfVolunteerCount: 120,
  ujatSecondHalfVolunteerCount: 100,
  targetLevels: ['elementary'],
  volunteerTargets: ['대학생'],
  scheduleTimeEnabled: true,
  startTime: '09:00',
  endTime: '12:00',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const draft = {
  title: 'UJAT 등록',
  paragraphs: [],
  formSettings: { titleNumbering: 'number' },
} as unknown as WritingFormDraft

describe('UJAT program adapters', () => {
  it('create 요청에 UJAT 제안값과 versioned 상세를 넣는다', () => {
    const request = toCreateRequest(program, {
      draft,
      overlay: { 'ujat.basicInfo.programManagementName': '2026 UJAT' },
    })
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      version?: number
      registration?: { overlay?: Record<string, unknown> }
    }

    expect(request.programType).toBe('UJAT')
    expect(request.educationStructure).toBe('SCHEDULE')
    expect(request.businessStartDate).toBe(program.startDate)
    expect(detail.version).toBe(1)
    expect(detail.registration?.overlay?.['ujat.basicInfo.programManagementName']).toBe(
      '2026 UJAT'
    )
  })

  it('UJAT 전용 필드를 serviceDetailJson으로 round-trip 한다', () => {
    const request = toCreateRequest(program)
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      serviceDetailJson: request.serviceDetailJson,
    })

    expect(mapped.ujatProgressStatus).toBe('VOLUNTEER_RECRUITING')
    expect(mapped.ujatFirstHalfVolunteerCount).toBe(120)
    expect(mapped.volunteerTargets).toEqual(['대학생'])
    expect(mapped.startTime).toBe('09:00')
  })

  it('수정 요청에서도 등록 draft와 overlay를 보존한다', () => {
    const created = toCreateRequest(program, {
      draft,
      overlay: { 'ujat.basicInfo.programManagementName': '2026 UJAT' },
    })
    const registration = parseRegistrationSnapshot(created.serviceDetailJson)
    const updated = toUpdateRequest(program, { title: '수정된 UJAT' }, registration)
    const detail = JSON.parse(updated.serviceDetailJson ?? '{}') as {
      registration?: { overlay?: Record<string, unknown> }
    }

    expect(detail.registration?.overlay?.['ujat.basicInfo.programManagementName']).toBe(
      '2026 UJAT'
    )
    expect(updated.title).toBe('수정된 UJAT')
    expect(updated.rounds).toBeUndefined()
    expect(updated.managerName).toBeUndefined()
  })

  it('상세 사업 기간은 businessStartDate/EndDate를 쓴다', () => {
    const mapped = fromDetail({
      id: program.id,
      startDate: '2026-10-21',
      endDate: '2026-11-01',
      businessStartDate: '2026-10-14',
      businessEndDate: '2026-11-07',
    })
    expect(mapped.startDate).toBe('2026-10-14')
    expect(mapped.endDate).toBe('2026-11-07')
  })

  it('등록·수정 사업 기간은 businessStartDate/EndDate로 보낸다', () => {
    const created = toCreateRequest(program)
    const updated = toUpdateRequest(program, {
      startDate: '2026-10-14',
      endDate: '2026-11-07',
    })
    expect(created.businessStartDate).toBe(program.startDate)
    expect(created.businessEndDate).toBe(program.endDate)
    expect(updated.businessStartDate).toBe('2026-10-14')
    expect(updated.businessEndDate).toBe('2026-11-07')
  })
})

describe('UJAT detailedProgramId·detailedProgramName (id·name 둘 다 삽입, 버그 수정 확인)', () => {
  it('detailedProgramId를 숫자로 요청에 실어 보낸다 (실제 카탈로그를 고른 경우)', () => {
    const withCatalog: Program = {
      ...program,
      detailedProgramId: '163006',
      generalCommonInfo: { detailedProgramName: '실제 선택한 세부 프로그램명' },
    }
    const request = toCreateRequest(withCatalog)
    expect(request.detailedProgramId).toBe(163006)
  })

  it('UJAT 고정 sentinel(카탈로그 미사용)이면 detailedProgramId는 null이지만 name은 보존된다', () => {
    const withSentinel: Program = {
      ...program,
      detailedProgramId: '__ujat_volunteer_core__',
      teamDivision: '대학생경제교육봉사단',
      generalCommonInfo: { detailedProgramName: '대학생경제교육봉사단' },
    }
    const request = toCreateRequest(withSentinel)
    expect(request.detailedProgramId).toBeUndefined()

    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: { generalCommonInfo?: { detailedProgramName?: string } }
    }
    expect(detail.program?.generalCommonInfo?.detailedProgramName).toBe('대학생경제교육봉사단')
  })

  it('상세 serviceDetailJson.registration.overlay를 화면용으로 붙인다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      serviceDetailJson: JSON.stringify({
        version: 1,
        program: {},
        registration: {
          draft: draft,
          overlay: {
            'ujat.basicInfo.repEn': 'Local Spending and Saving',
            'ujat.kpi.participantCount': 61,
          },
        },
      }),
    })
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.repEn']).toBe(
      'Local Spending and Saving'
    )
    expect(mapped.ujatRegistrationOverlay?.['ujat.kpi.participantCount']).toBe(61)
  })

  it('응답의 detailedProgramId·detailedProgramName을 Program에 round-trip 한다', () => {
    const mapped = fromDetail({
      id: program.id,
      sponsorId: program.sponsorId,
      title: program.title,
      startDate: String(program.startDate),
      endDate: String(program.endDate),
      detailedProgramId: 163006,
      detailedProgramName: '실제 선택한 세부 프로그램명',
    })
    expect(mapped.detailedProgramId).toBe('163006')
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
  })
})

describe('UJAT create — overlay 1차 컬럼 반영 (버그 수정 확인)', () => {
  it('등록 스냅샷 create 요청에 영문명·사업분야·IP·모집기간을 실어 보낸다', () => {
    const created = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-pending-1',
      overlay: {
        'ujat.basicInfo.repKo': '우리 동네 소비와 저축',
        'ujat.basicInfo.repEn': 'Local Spending and Saving',
        'ujat.basicInfo.programManagementName': '우리 동네 소비와 저축 운영',
        'ujat.basicInfo.businessField': 'digital_literacy',
        'ujat.basicInfo.ipOwned': 'jointly',
        'ujat.basicInfo.courseDeliveredBy': 'ja',
        'ujat.basicInfo.partnerInvolvement': 'yes',
        'ujat.basicInfo.educationCourse': 'digital_computer',
        'ujat.recruit.institution.recruitRange': {
          start: '2026-11-10T15:00:00.000Z',
          end: '2026-11-24T15:00:00.000Z',
        },
        'ujat.recruit.institution.contact': {
          name: '정민재',
          phone: '031-234-5678',
          email: 'edu.team@jakorea.org',
        },
      },
    })
    const request = toCreateRequest(created, {
      draft,
      overlay: { 'ujat.basicInfo.repEn': 'Local Spending and Saving' },
    })

    expect(request.titleEn).toBe('Local Spending and Saving')
    expect(request.businessArea).toBe('디지털리터러시')
    expect(request.ipOwned).toBe('Jointly')
    expect(request.courseDeliveredBy).toBe('JA')
    expect(request.partnerInvolvement).toBe(true)
    expect(request.educationProcess).toBe('digital_computer')
    expect(request.applicationStartDate).toBe('2026-11-10T15:00:00.000Z')
    expect(request.applicationEndDate).toBe('2026-11-24T15:00:00.000Z')
    expect(request.managerName).toBe('정민재')
    expect(request.contactPhone).toBe('031-234-5678')
    expect(request.contactEmail).toBe('edu.team@jakorea.org')
  })

  it('목록은 관리명(title)과 대표명(mainTitle)을 구분한다', () => {
    const mapped = fromListItem({
      id: 186100,
      title: '프로그램 관리명',
      mainTitle: '우리 동네 소비와 저축',
    })

    expect(mapped.title).toBe('프로그램 관리명')
    expect(mapped.mainTitle).toBe('우리 동네 소비와 저축')
  })

  it('목록 titleEn은 상세와 같은 값을 유지한다', () => {
    const mapped = fromListItem({
      id: 186101,
      title: '프로그램 관리명',
      mainTitle: '우리 동네 소비와 저축',
      titleEn: 'Local Spending',
    })

    expect(mapped.titleEn).toBe('Local Spending')
  })
})

describe('UJAT API policy', () => {
  it('목록 요청은 programType UJAT를 강제한다', () => {
    expect(toRemoteListParams({ businessYear: 2026 })).toEqual({
      programType: 'UJAT',
      businessYear: 2026,
      page: 0,
      size: 20,
    })
  })

  it('4xx는 재시도하지 않고 일시 오류만 최대 1회 재시도한다', () => {
    expect(shouldRetryQuery(0, { response: { status: 422 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 503 } })).toBe(true)
    expect(shouldRetryQuery(1, { response: { status: 503 } })).toBe(true)
    expect(shouldRetryQuery(2, { response: { status: 503 } })).toBe(false)
  })
})
