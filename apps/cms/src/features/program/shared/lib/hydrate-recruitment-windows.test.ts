import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  hydrateRecruitmentWindowsOntoProgram,
  recruitmentPeriodLabelFromWindow,
} from './hydrate-recruitment-windows'
import { resolveGeneralProgramVolunteerRecruitmentDisplay } from '@/features/program/general/lib/volunteer-recruitment-display'
import { resolveGeneralProgramInstructorRecruitmentDisplay } from '@/features/program/general/lib/instructor-recruitment-display'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'

function programWithRows(): Program {
  return {
    id: '186251',
    title: '기관',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_volunteers',
    backendProgramType: 'GENERAL_ORGANIZATION',
    rounds: [],
    startDate: '2026-11-18',
    endDate: '2026-12-31',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    volunteerApplicationStartDate: '2026-10-01T15:00:00.000Z',
    volunteerApplicationEndDate: '2026-10-20T14:59:59.999Z',
    generalCommonInfo: {
      volunteerRecruitmentInfo: {
        recruitmentPeriodLabel: '2026. 10. 02 (금) ~ 2026. 10. 21 (수)',
        contactOrganizationName: '옛 문의처',
        inquiryTel: '010-0000-0000',
      },
      instructorRecruitmentInfo: {
        recruitmentPeriodLabel: '2026. 10. 01 ~ 2026. 11. 01',
      },
    },
    programRecruitments: [
      {
        id: 186603,
        recruitmentType: 'PARTICIPANT',
        applicationType: 'ORGANIZATION',
        startAt: '2026-10-17T00:00:00.000Z',
        endAt: '2026-11-22T00:00:00.000Z',
      },
      {
        id: 186604,
        recruitmentType: 'INSTRUCTOR',
        applicationType: 'INSTRUCTOR',
        startAt: '2026-10-16T15:00:00.000Z',
        endAt: '2026-11-22T14:59:59.999Z',
        contactName: '강사 담당',
        contactPhone: '010-1111-2222',
      },
      {
        id: 186605,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        startAt: '2026-10-13T15:00:00.000Z',
        endAt: '2026-10-31T14:59:59.999Z',
        operationStartDate: '2026-11-18',
        operationEndDate: '2026-12-31',
        contactName: '봉사 담당',
        contactPhone: '010-3333-4444',
        contactEmail: 'vol@jakorea.org',
        interviewStartAt: '2026-11-01T00:00:00.000Z',
        interviewEndAt: '2026-11-02T00:00:00.000Z',
      },
    ],
  }
}

describe('hydrateRecruitmentWindowsOntoProgram', () => {
  it('행 startAt/endAt이 프로그램 컬럼·nested 라벨보다 우선한다', () => {
    const next = hydrateRecruitmentWindowsOntoProgram(programWithRows())
    expect(String(next.volunteerApplicationStartDate)).toContain('2026-10-13')
    expect(String(next.volunteerApplicationEndDate)).toContain('2026-10-31')
    expect(next.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentPeriodLabel).toContain(
      '2026'
    )
    expect(recruitmentPeriodLabelFromWindow(next.programRecruitments?.[2])).toBeTruthy()
    expect(next.generalCommonInfo?.volunteerRecruitmentInfo?.inquiryTel).toBe('010-3333-4444')
    expect(next.instructorApplicationStartDate).toContain('2026-10-16')
    expect(next.applicationStartDate).toContain('2026-10-17')
  })
})

describe('모집 탭 표시·폼 시드 — 행 SSOT', () => {
  it('volunteer nested 라벨이 기관 기간이어도 행 startAt/endAt만 보여 준다', () => {
    const program = programWithRows()
    program.generalCommonInfo = {
      ...program.generalCommonInfo,
      volunteerRecruitmentInfo: {
        ...program.generalCommonInfo?.volunteerRecruitmentInfo,
        recruitmentPeriodLabel: '2026. 10. 17 (토) ~ 2026. 11. 22 (일)',
      },
    }
    const display = resolveGeneralProgramVolunteerRecruitmentDisplay(program)
    expect(display.recruitmentPeriodLabel).not.toContain('10. 17')
    expect(display.recruitmentPeriodLabel).not.toContain('11. 22')
    expect(display.contactOrganizationName).toBe('봉사 담당')
  })

  it('봉사자 모집기간·문의처·면접은 행 값을 보여 준다', () => {
    const program = programWithRows()
    const display = resolveGeneralProgramVolunteerRecruitmentDisplay(program)
    expect(display.recruitmentPeriodLabel).not.toBe('-')
    expect(display.recruitmentPeriodLabel).not.toContain('10. 02')
    expect(display.contactOrganizationName).toBe('봉사 담당')
    expect(display.contactPhone).toBe('010-3333-4444')
    expect(display.contactEmail).toBe('vol@jakorea.org')
    expect(String(display.interviewStartDate)).toContain('2026-11-01')
  })

  it('강사 모집기간·문의처는 행 값을 보여 준다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay(programWithRows())
    expect(display.recruitmentPeriodLabel).not.toBe('2026. 10. 01 ~ 2026. 11. 01')
    expect(display.contactOrganizationName).toBe('강사 담당')
    expect(display.contactPhone).toBe('010-1111-2222')
  })

  it('봉사자 폼 시드도 행 기간을 쓴다', () => {
    const values = programToRecruitmentTabEditValues(programWithRows(), 'volunteer')
    expect(String(values.volunteerApplicationStartDate)).toContain('2026-10-13')
    expect(String(values.volunteerApplicationEndDate)).toContain('2026-10-31')
    expect(String(values.interviewStartDate)).toContain('2026-11-01')
    expect(values.volunteerContactPhone).toBe('010-3333-4444')
  })

  it('overlay recruitRangeSeal이 있어도 행 기간을 덮지 않는다', () => {
    const program = programWithRows()
    program.registrationOverlay = {
      'recruit.volunteer.recruitRangeSeal': {
        start: '2026-10-01T15:00:00.000Z',
        end: '2026-10-20T14:59:59.999Z',
      },
      'recruit.volunteer.inquiryTel': '010-0000-0000',
    }
    const display = resolveGeneralProgramVolunteerRecruitmentDisplay(program)
    expect(display.recruitmentPeriodLabel).not.toContain('10. 02')
    expect(display.contactPhone).toBe('010-3333-4444')
    const values = programToRecruitmentTabEditValues(program, 'volunteer')
    expect(String(values.volunteerApplicationStartDate)).toContain('2026-10-13')
    expect(values.volunteerContactPhone).toBe('010-3333-4444')
  })
})
