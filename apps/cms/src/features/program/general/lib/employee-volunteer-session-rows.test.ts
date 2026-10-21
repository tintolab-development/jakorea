import { describe, expect, it } from 'vitest'
import {
  resolveEmployeeVolunteerSessionRows,
  resolveEmployeeVolunteerSessionRowsForInstitution,
} from './employee-volunteer-session-rows'
import type { Program } from '@/types/domain'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'prog-1',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    ...overrides,
  } as Program
}

describe('resolveEmployeeVolunteerSessionRows', () => {
  it('단일 회차는 프로그램 진행 1행만 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '오리엔테이션' }],
        },
      })
    )

    expect(rows).toEqual([
      expect.objectContaining({ id: 'program_progress', label: '프로그램 진행' }),
    ])
  })

  it('복수 커리큘럼형은 사전교육 + 회차 라벨을 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          curriculumSessions: [
            { sessionLabel: '1회차 교육', title: '1차시', description: '' },
            { sessionLabel: '2회차 교육', title: '2차시', description: '' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['사전교육', '1회차 교육', '2회차 교육'])
    expect(rows[0]?.countsTowardParticipants).toBe(true)
  })

  it('복수 일정형은 scheduleDetails name을 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramAudience: 'individual',
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [
            { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
            { scheduleLabel: '세부 일정 02', name: '국내대회' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['오리엔테이션', '국내대회'])
  })

  it('복수 일정형에서 scheduleDetails가 비어 있으면 사전교육 외 행을 만들지 않는다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          scheduleDetails: [],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['사전교육'])
  })

  it('기관 복수 커리큘럼형은 회차명 대신 N회차 교육으로 표기한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramAudience: 'organization',
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          curriculumSessions: [
            { sessionLabel: '필요와 욕구, 현명한 소비', title: '1차시', description: '' },
            { sessionLabel: '학교 / 기관 프로그램 제목', title: '2차시', description: '' },
            { sessionLabel: '학교 / 기관 프로그램 제목 2', title: '3차시', description: '' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual([
      '사전교육',
      '1회차 교육',
      '2회차 교육',
      '3회차 교육',
    ])
  })

  it('기관 복수 일정형은 실제 scheduleDetails name을 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramAudience: 'organization',
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [
            { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
            { scheduleLabel: '세부 일정 02', name: '국내대회' },
            { scheduleLabel: '세부 일정 03', name: '발표회' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['오리엔테이션', '국내대회', '발표회'])
  })

  it('단일 회차 커리큘럼형은 프로그램 진행 1행만 노출한다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramSessionRound: 'single',
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          curriculumSessions: [{ sessionLabel: '1회차 교육', title: '1차시', description: '' }],
        },
      })
    )

    expect(rows).toEqual([
      expect.objectContaining({ id: 'program_progress', label: '프로그램 진행' }),
    ])
  })

  it('복수 일정형 사전 교육 블록은 합성 사전교육 행과 중복하지 않는다', () => {
    const rows = resolveEmployeeVolunteerSessionRows(
      baseProgram({
        generalProgramAudience: 'individual',
        generalProgramSessionRound: 'multi',
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleCurriculumPreEducation: true,
          scheduleDetails: [
            { scheduleLabel: '사전 교육', name: '사전 교육' },
            { scheduleLabel: '행사 일정 01', name: '오리엔테이션' },
          ],
        },
      })
    )

    expect(rows.map(row => row.label)).toEqual(['사전교육', '오리엔테이션'])
  })
})

describe('resolveEmployeeVolunteerSessionRowsForInstitution', () => {
  const school = {
    id: 'school-1',
    schoolName: '테스트초',
  } as ParticipatingSchoolRow

  it('단일 회차 프로그램 진행 행에 기관 배정 일정 라벨을 노출한다', () => {
    const program = baseProgram({
      generalProgramSessionRound: 'single',
      generalProgramEducationStructure: 'schedule',
    })
    const rows = resolveEmployeeVolunteerSessionRowsForInstitution(program, {
      ...school,
      sessions: [
        {
          round: 1,
          date: '2026.03.01',
          dayOfWeek: '일',
          duration: '2',
          format: '오프라인',
          classNum: '1',
          timeRange: '10:00~12:00',
          educationScheduleLabel: '2026. 03. 01(일) 10:00 ~ 12:00',
        },
      ],
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('program_progress')
    expect(rows[0]?.label).toBe('2026. 03. 01(일) 10:00 ~ 12:00')
  })

  it('기관 복수 커리큘럼은 N회차 교육 라벨을 유지한다', () => {
    const program = baseProgram({
      generalProgramAudience: 'organization',
      generalProgramSessionRound: 'multi',
      generalProgramEducationStructure: 'curriculum',
      generalCommonInfo: {
        scheduleCurriculumPreEducation: true,
        curriculumSessions: [
          { sessionLabel: '1회차', title: '1', description: '' },
          { sessionLabel: '2회차', title: '2', description: '' },
        ],
      },
    })
    const rows = resolveEmployeeVolunteerSessionRowsForInstitution(program, {
      ...school,
      sessions: [
        {
          round: 1,
          date: '2026.03.01',
          dayOfWeek: '일',
          duration: '2',
          format: '오프라인',
          classNum: '1',
          timeRange: '10:00~12:00',
          educationScheduleLabel: '기관별 1회차 일정',
        },
      ],
    })

    expect(rows.map(row => row.label)).toEqual(['사전교육', '1회차 교육', '2회차 교육'])
  })
})
