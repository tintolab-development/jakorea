import { describe, expect, it } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import { fromDetail, toUpdateRequest } from '@/features/program/ujat/api/adapters'
import { resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import type { UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import { ujatEducationScheduleSettingsOverlayKeys } from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { ujatHalfScheduleOverlayKeys } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { UJAT_REGION_CAPACITY_OVERLAY_KEY } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { applyUjatRegistrationOverlayToProgram } from './ujat-registration-basic-info-display'

const draft = {
  title: 'UJAT 등록',
  paragraphs: [],
  formSettings: { titleNumbering: 'number' },
} as unknown as WritingFormDraft

const capacity = {
  h1: { 서울: { classCount: '2', volunteerCount: '4' } },
  h2: { 부산: { classCount: '1', volunteerCount: '2' } },
}

const canonicalRegionCapacities = {
  FIRST_HALF: { SEOUL: { maxSchools: 2, maxVolunteers: 4 } },
  SECOND_HALF: { BUSAN: { maxSchools: 1, maxVolunteers: 2 } },
}

function baseProgram(): Program {
  return {
    id: 'ujat-roundtrip',
    sponsorId: '163388',
    title: 'UJAT',
    mainTitle: 'UJAT',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    status: 'active',
    ips: 'Prepare',
    generalProgramEducationStructure: 'schedule',
    generalCommonInfo: {
      sponsorManagerContactIds: ['contact-1'],
      kpi: {
        finalParticipants: 10,
        instructorCount: 0,
        volunteerCount: 4,
        finalSchools: 2,
        finalClasses: 3,
      },
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function registrationOverlay(): Record<string, unknown> {
  const h1 = ujatHalfScheduleOverlayKeys('h1')
  const h2 = ujatHalfScheduleOverlayKeys('h2')
  const unavailable = ujatEducationScheduleSettingsOverlayKeys('h1')
  return {
    'ujat.basicInfo.repKo': 'UJAT',
    'ujat.basicInfo.programManagementName': 'UJAT',
    'ujat.basicInfo.ipsCategory': 'inspire',
    'ujat.basicInfo.sponsorId': '163388',
    'ujat.basicInfo.sponsorContactIds': ['1627253'],
    'ujat.basicInfo.sponsorContactId': '1627253',
    [UJAT_REGION_CAPACITY_OVERLAY_KEY]: capacity,
    [h1.eventName]: '상반기 본행사',
    [h1.eventRange]: {
      start: '2026-04-03T00:00:00.000Z',
      end: '2026-06-19T00:00:00.000Z',
    },
    [h2.eventName]: '하반기 본행사',
    [h2.eventRange]: {
      start: '2026-09-01T00:00:00.000Z',
      end: '2026-11-15T00:00:00.000Z',
    },
    [unavailable.unavailableDates]: ['2026-05-15'],
  }
}

describe('UJAT 공통정보 저장 왕복', () => {
  it('IPS·담당자·지역 정원·상하반기·불가일이 요청과 재조회에 남는다', () => {
    const overlay = registrationOverlay()
    const applied = applyUjatRegistrationOverlayToProgram(
      { ...baseProgram(), generalProgramEducationStructure: 'curriculum' },
      overlay
    )
    const program: Program = {
      ...applied,
      generalProgramEducationStructure: 'curriculum',
      ujatRegistrationOverlay: overlay,
    }
    const request = toUpdateRequest(
      program,
      {
        ips: program.ips,
        sponsorId: program.sponsorId,
        generalCommonInfo: program.generalCommonInfo,
        generalProgramEducationStructure: 'curriculum',
        title: program.title,
      },
      { draft, overlay }
    )

    expect(request.educationStructure).toBe('CURRICULUM')
    expect(request.detailedProgramId).toBeUndefined()
    expect(request.ips).toBe('Inspire')
    expect(request.sponsors).toEqual([{ sponsorId: '163388', sponsorContactId: '1627253' }])
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(detail.registration?.overlay?.[UJAT_REGION_CAPACITY_OVERLAY_KEY]).toBeUndefined()
    expect(detail.registration?.overlay?.['ujat.h1.event.name']).toBeUndefined()
    expect(detail.registration?.overlay?.['ujat.h1.eduSchedule.unavailableDates']).toBeUndefined()

    const persisted = JSON.parse(request.serviceDetailJson ?? '{}') as Record<string, unknown>
    persisted.ujatRegionCapacities = canonicalRegionCapacities
    const typedDetail: UjatTypedDetail = {
      schemaVersion: 1,
      common: null,
      halfPlans: [
        {
          semesterType: 'FIRST_HALF',
          stages: [
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                {
                  rowId: 'h1-main-1',
                  educationName: '상반기 본행사',
                  startDate: '2026-04-03',
                  endDate: '2026-06-19',
                  excludedDates: ['2026-05-15'],
                  exclusion: { excludeNone: false },
                },
              ],
            },
          ],
        },
      ],
    }
    const mapped = fromDetail({
      id: program.id,
      title: program.title,
      sponsorId: '163388',
      ips: 'Inspire',
      educationStructure: 'CURRICULUM',
      serviceDetailJson: JSON.stringify(persisted),
    } as ProgramResponse, typedDetail)

    expect(mapped.ips).toBe('Inspire')
    expect(mapped.generalProgramEducationStructure).toBe('curriculum')
    expect(mapped.ujatRegistrationOverlay?.[UJAT_REGION_CAPACITY_OVERLAY_KEY]).toBeUndefined()
    expect(mapped.ujatRegionCapacity).toEqual(capacity)
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.ipsCategory']).toBe('inspire')
    const schedule = resolveUjatEducationScheduleSettingsSemesterDisplayFromTypedDetail(
      'h1',
      typedDetail
    )
    expect(schedule.scheduleRangeText).not.toBe('-')
    expect(schedule.unavailableDates).toEqual(['2026-05-15'])
  })

  it('IPS만 바꿔도 지역 정원 overlay는 유지된다', () => {
    const overlay = {
      ...registrationOverlay(),
      'ujat.basicInfo.ipsCategory': 'succeed',
    }
    const applied = applyUjatRegistrationOverlayToProgram(baseProgram(), overlay)
    const request = toUpdateRequest(
      { ...applied, ujatRegistrationOverlay: overlay },
      {
        ips: applied.ips,
        generalCommonInfo: applied.generalCommonInfo,
      },
      { draft, overlay }
    )
    expect(request.ips).toBe('Succeed')
    const persisted = JSON.parse(request.serviceDetailJson ?? '{}') as Record<string, unknown>
    persisted.ujatRegionCapacities = canonicalRegionCapacities
    const mapped = fromDetail({
      id: 'ujat-roundtrip',
      title: 'UJAT',
      ips: 'Succeed',
      serviceDetailJson: JSON.stringify(persisted),
    } as ProgramResponse)
    expect(mapped.ujatRegistrationOverlay?.['ujat.basicInfo.ipsCategory']).toBe('succeed')
    expect(mapped.ujatRegistrationOverlay?.[UJAT_REGION_CAPACITY_OVERLAY_KEY]).toBeUndefined()
    expect(mapped.ujatRegionCapacity).toEqual(capacity)
  })

  it('registration draft가 없는 레거시 상세도 편집 overlay를 보존한다', () => {
    const overlay = registrationOverlay()
    const request = toUpdateRequest(
      { ...baseProgram(), ujatRegistrationOverlay: overlay },
      { ips: 'Succeed' },
      { overlay }
    )
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      registration?: { draft?: unknown; overlay?: Record<string, unknown> }
    }
    expect(detail.registration?.draft).toBeUndefined()
    expect(detail.registration?.overlay?.[UJAT_REGION_CAPACITY_OVERLAY_KEY]).toBeUndefined()
    expect(detail.registration?.overlay?.['ujat.h1.event.name']).toBeUndefined()
  })
})
