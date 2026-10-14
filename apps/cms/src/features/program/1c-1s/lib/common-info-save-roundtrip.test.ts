import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import {
  mapCompanySchoolDetailToProgram,
  mapCompanySchoolToUpdateRequest,
} from '@/features/program/1c-1s/api/adapters'
import { applyEconomyRegistrationOverlayToProgram } from '@/features/program/general/lib/economy-registration-overlay-to-program'
import {
  readEconomyRegistrationOverlayForSave,
  seedEconomyRegistrationOverlayFromProgram,
} from './registration-overlay-sync'
import { resetProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

/** GET은 요청 instant의 서울 달력일 `yyyy-MM-dd` 를 돌려준다. */
function seoulCalendarDate(value: string | undefined): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return value.slice(0, 10)
  return new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function baseProgram(): Program {
  return {
    id: 'company-school-roundtrip',
    sponsorId: '163388',
    title: '1사1교',
    mainTitle: '1사1교',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-10-31T00:00:00.000Z',
    applicationStartDate: '2026-03-01T00:00:00.000Z',
    applicationEndDate: '2026-03-20T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    generalVolunteers: 0,
    rounds: [
      {
        id: 'round-1',
        programId: 'company-school-roundtrip',
        roundNumber: 1,
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-10-31T00:00:00.000Z',
        status: 'active',
      },
    ],
    generalCommonInfo: {
      educationScheduleMode: 'period',
      educationScheduleLines: ['2026. 04. 01 ~ 2026. 10. 31'],
      wageGradeRows: [{ grade: '1급 강사비', pricing: '1시간 당 | 기본 : 100,000원' }],
      kpi: {
        finalParticipants: 10,
        instructorCount: 1,
        volunteerCount: 0,
        finalSchools: 1,
        finalClasses: 1,
      },
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('1사1교 공통정보 저장 왕복', () => {
  it('canonical 커리큘럼이 stale economy overlay보다 우선한다', () => {
    resetProgramRegistrationOverlay()
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '최신 1차시', description: '최신 내용' },
        ],
      },
      registrationOverlay: {
        'economyRegistration.educationCurriculum.session1.title': '구 1차시',
        'economyRegistration.educationCurriculum.session1.description': '구 내용',
      },
    }
    seedEconomyRegistrationOverlayFromProgram(program)
    const overlay = readEconomyRegistrationOverlayForSave()
    expect(overlay['economyRegistration.educationCurriculum.session1.title']).toBe('최신 1차시')
    expect(overlay['economyRegistration.educationCurriculum.session1.description']).toBe(
      '최신 내용'
    )
  })

  it('기간·1회차·담당자·KPI가 요청과 재조회에 남고 봉사자는 0이다', () => {
    const existing = baseProgram()
    const applied = applyEconomyRegistrationOverlayToProgram(existing, {
      'economyRegistration.basicInfo.operationRangeSeal': {
        start: '2026-11-21T15:00:00.000Z',
        end: '2026-12-22T15:00:00.000Z',
      },
      'economyRegistration.educationScheduleSettings.dateRangeSeal': {
        start: '2026-11-21T00:00:00.000Z',
        end: '2026-12-22T00:00:00.000Z',
      },
      'economyRegistration.basicInfo.sponsorId': '163388',
      'economyRegistration.basicInfo.managerContactIds': ['1627253'],
      'economyRegistration.kpi.participantCount': 80,
      'economyRegistration.kpi.instructor': 4,
      'economyRegistration.kpi.dispatchedSchool': 5,
      'economyRegistration.kpi.dispatchedClass': 11,
      'economyRegistration.wageInfo.grade1Fee': 140000,
    })

    const request = mapCompanySchoolToUpdateRequest(existing, {
      startDate: applied.startDate,
      endDate: applied.endDate,
      rounds: applied.rounds,
      sponsorId: applied.sponsorId,
      approvedStudentCount: applied.approvedStudentCount,
      instructors: applied.instructors,
      instructorCapacity: applied.instructorCapacity,
      participatingSchoolCount: applied.participatingSchoolCount,
      generalVolunteers: 0,
      generalCommonInfo: applied.generalCommonInfo,
    })

    expect(request.applicationStartDate).toBeUndefined()
    expect(request.sponsors).toEqual([{ sponsorId: '163388', sponsorContactId: '1627253' }])
    expect(request.generalVolunteers).toBe(0)
    expect(request.rounds?.[0]?.startDate).toBe(applied.startDate)
    expect(request.rounds?.[0]?.endDate).toBe(applied.endDate)
    const screenStart = seoulCalendarDate(request.startDate ?? undefined)
    const screenEnd = seoulCalendarDate(request.endDate ?? undefined)

    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      program?: {
        generalCommonInfo?: {
          educationScheduleMode?: string
          educationScheduleLines?: string[]
          wageGradeRows?: Array<{ pricing?: string }>
          kpi?: {
            finalParticipants?: number
            instructorCount?: number
            volunteerCount?: number
            finalSchools?: number
            finalClasses?: number
          }
        }
      }
    }
    const common = detail.program?.generalCommonInfo
    expect(common?.educationScheduleMode).toBe('period')
    expect(common?.educationScheduleLines?.[0]).toContain('2026')
    expect(common?.wageGradeRows?.[0]?.pricing).toContain('140,000')
    expect(common?.kpi).toMatchObject({
      finalParticipants: 80,
      instructorCount: 4,
      volunteerCount: 0,
      finalSchools: 5,
      finalClasses: 11,
    })

    const reloaded = mapCompanySchoolDetailToProgram({
      id: existing.id,
      title: existing.title,
      sponsorId: request.sponsorId,
      startDate: screenStart,
      endDate: screenEnd,
      businessStartDate: screenStart,
      businessEndDate: screenEnd,
      rounds: request.rounds?.map(round => ({
        ...round,
        startDate: seoulCalendarDate(
          typeof round.startDate === 'string' ? round.startDate : undefined
        ),
        endDate: seoulCalendarDate(typeof round.endDate === 'string' ? round.endDate : undefined),
      })),
      generalVolunteers: request.generalVolunteers,
      serviceDetailJson: request.serviceDetailJson,
    } as ProgramResponse)

    expect(reloaded.startDate).toBe(screenStart)
    expect(reloaded.endDate).toBe(screenEnd)
    expect(reloaded.rounds?.[0]?.startDate).toBe(screenStart)
    expect(reloaded.rounds?.[0]?.endDate).toBe(screenEnd)
    expect(reloaded.generalCommonInfo?.educationScheduleMode).toBe('period')
    expect(reloaded.generalCommonInfo?.wageGradeRows?.[0]?.pricing).toContain('140,000')
    expect(reloaded.generalCommonInfo?.kpi?.volunteerCount).toBe(0)
    expect(reloaded.generalCommonInfo?.kpi?.finalParticipants).toBe(80)
    expect(reloaded.generalCommonInfo?.kpi?.finalClasses).toBe(11)
    expect(reloaded.generalVolunteers).toBe(0)
  })
})
