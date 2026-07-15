import { describe, expect, it } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'
import { fromDetail, toCreateRequest, toUpdateRequest } from './adapters'
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
  })
})

describe('UJAT API policy', () => {
  it('목록 요청은 programType UJAT를 강제한다', () => {
    expect(toRemoteListParams({ businessYear: 2026 })).toEqual({
      programType: 'UJAT',
      businessYear: 2026,
      page: 0,
      size: 100,
    })
  })

  it('4xx는 재시도하지 않고 일시 오류만 최대 1회 재시도한다', () => {
    expect(shouldRetryQuery(0, { response: { status: 422 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 503 } })).toBe(true)
    expect(shouldRetryQuery(1, { response: { status: 503 } })).toBe(true)
    expect(shouldRetryQuery(2, { response: { status: 503 } })).toBe(false)
  })
})
