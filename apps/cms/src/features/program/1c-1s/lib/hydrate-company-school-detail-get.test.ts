/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { mapCompanySchoolDetailToProgram } from '@/features/program/1c-1s/api/adapters'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'

function overlayOnlyDto(overlay: Record<string, unknown>): ProgramResponse {
  return {
    id: '186900',
    title: '컬럼 제목',
    mainTitle: '컬럼 대표명',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      program: {},
      registration: { overlay },
    }),
  } as ProgramResponse
}

describe('hydrateCompanySchoolDetailFromGet', () => {
  it('overlay-only GET 이 KPI·강사비·공고명을 Typed 필드로 올린다', () => {
    const mapped = mapCompanySchoolDetailToProgram(
      overlayOnlyDto({
        'economyRegistration.basicInfo.publicProgramTitle': '오버레이 공고',
        'economyRegistration.kpi.participantCount': 0,
        'economyRegistration.kpi.instructor': null,
        'economyRegistration.wageInfo.grade1Fee': 111000,
        'economyRegistration.wageInfo.grade1DistanceFee': 112000,
        'economyRegistration.wageInfo.paymentItemValues': ['166201'],
        'economyRegistration.kpi.volunteer': 7,
      })
    )

    expect(mapped.generalCommonInfo?.announcementTitle).toBe('오버레이 공고')
    expect(mapped.generalCommonInfo?.kpi?.finalParticipants).toBe(0)
    expect(mapped.registrationOverlay?.['economyRegistration.kpi.instructor']).toBeNull()
    expect(mapped.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('111,000')
    expect(mapped.registrationOverlay?.['economyRegistration.kpi.volunteer']).toBe(7)
  })

  it('GET recruitments[] 운영기간이 overlay seal 보다 우선한다', () => {
    const mapped = mapCompanySchoolDetailToProgram({
      id: '186901',
      title: '행 SSOT',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      recruitments: [
        {
          id: 1,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-03-01T00:00:00+09:00',
          endAt: '2026-03-10T00:00:00+09:00',
          operationStartDate: '2026-04-01',
          operationEndDate: '2026-04-30',
          contactName: '행 담당',
          contactPhone: '02-000-0000',
          contactEmail: 'row@example.invalid',
        },
      ],
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {},
        registration: {
          overlay: {
            'economyRegistration.basicInfo.operationRangeSeal': {
              start: '2026-01-01',
              end: '2026-12-31',
            },
            'recruit.inquiryContact': '오버레이 담당',
          },
        },
      }),
    } as ProgramResponse)

    const info = mapped.generalCommonInfo?.participantRecruitmentInfo
    expect(info?.operationPeriodLabel).toMatch(/2026\.04\.01/)
    expect(info?.recruitmentPeriodLabel).toMatch(/2026\.03\.01/)
    expect(info?.contactName ?? info?.contactOrganizationName).toBe('행 담당')
  })

  it('명시적 빈 문자열 sidecar 와 미매핑 키를 유지한다', () => {
    const mapped = mapCompanySchoolDetailToProgram(
      overlayOnlyDto({
        'economyRegistration.kpi.volunteer': null,
        'economyRegistration.kpi.educationProgress.note': '',
        'application.instructor.memo': 'keep',
      })
    )
    expect(mapped.registrationOverlay?.['economyRegistration.kpi.volunteer']).toBeNull()
    expect(mapped.registrationOverlay?.['economyRegistration.kpi.educationProgress.note']).toBe('')
    expect(mapped.registrationOverlay?.['application.instructor.memo']).toBe('keep')
  })
})

void (null as unknown as Program)
