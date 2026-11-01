import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramInstructorRecruitmentDisplay } from '@/features/program/general/lib/instructor-recruitment-display'

describe('최종 합격자 발표 — 방법 표시', () => {

  it('수정 저장 후 합성 라벨이 있어도 날짜가 두 번 나오지 않는다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay({
      finalPassAnnouncementDate: '2026-10-07T15:00:00.000Z',
      finalPassAnnouncementMethod: '○○○',
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          finalAnnouncementLabel: '2026.10.08(목) | ○○○',
        },
      },
    } as unknown as Program)
    expect(display.finalPassAnnouncementMethod).toBe('○○○')
  })
})

describe('강사 모집 문의처 — 강사 행이 없을 때 (1사1교 QA #13)', () => {
  it('참여 행만 있으면 중첩 instructorRecruitmentInfo 문의처를 표시한다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay({
      contactName: '최상위 문의처',
      programRecruitments: [{ id: 1, recruitmentType: 'PARTICIPANT', contactName: '참여 문의처' }],
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          contactOrganizationName: '최수아',
          inquiryTel: '02-512-3456',
          inquiryEmail: 'school.partner@jakorea.org',
        },
      },
    } as unknown as Program)
    expect(display.contactOrganizationName).toBe('최수아')
    expect(display.contactPhone).toBe('02-512-3456')
    expect(display.contactEmail).toBe('school.partner@jakorea.org')
  })

  it('중첩 값도 없으면 최상위 contactName으로 폴백한다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay({
      contactName: '최상위 문의처',
      programRecruitments: [{ id: 1, recruitmentType: 'PARTICIPANT' }],
      generalCommonInfo: { instructorRecruitmentInfo: {} },
    } as unknown as Program)
    expect(display.contactOrganizationName).toBe('최상위 문의처')
  })

  it('강사 행이 있으면 기존처럼 행 값만 쓴다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay({
      contactName: '최상위 문의처',
      programRecruitments: [{ id: 2, recruitmentType: 'INSTRUCTOR' }],
      generalCommonInfo: { instructorRecruitmentInfo: { contactOrganizationName: '중첩' } },
    } as unknown as Program)
    expect(display.contactOrganizationName).toBe('-')
  })
})

describe('강사 모집 기간·현황 — 강사 행이 없을 때 (1사1교 186473)', () => {
  it('참여 행만 있으면 중첩 라벨과 스칼라 날짜로 기간·현황을 표시한다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay({
      instructorApplicationStartDate: '2000-01-01T00:00:00.000Z',
      instructorApplicationEndDate: '2999-12-31T14:59:59.999Z',
      programRecruitments: [
        {
          id: 1,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-10-29T15:00:00Z',
          endAt: '2027-10-10T14:59:59.999Z',
          operationStartDate: '2026-10-30',
          operationEndDate: '2027-11-30',
        },
      ],
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          recruitmentPeriodLabel: '2026.10.30(금) ~ 2026.12.31(목)',
          operationPeriodLabel: '2026.10.30(금) ~ 2027.11.10(수)',
        },
      },
    } as unknown as Program)
    expect(display.operationPeriodLabel).toBe('2026.10.30(금) ~ 2027.11.10(수)')
    expect(display.recruitmentPeriodLabel).toBe('2026.10.30(금) ~ 2026.12.31(목)')
    expect(display.recruitmentStatusLifecycle).toBe('recruiting_instructors')
    expect(display.recruitmentStatusLabel).not.toBe('-')
  })

  it('강사 행이 있으면 중첩 라벨·스칼라 날짜 대신 행 값만 쓴다', () => {
    const display = resolveGeneralProgramInstructorRecruitmentDisplay({
      instructorApplicationStartDate: '2000-01-01T00:00:00.000Z',
      instructorApplicationEndDate: '2999-12-31T14:59:59.999Z',
      programRecruitments: [
        {
          id: 2,
          recruitmentType: 'INSTRUCTOR',
          applicationType: 'INSTRUCTOR',
          startAt: '2001-01-01T00:00:00Z',
          endAt: '2001-12-31T14:59:59.999Z',
        },
      ],
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          recruitmentPeriodLabel: '중첩 모집 기간',
          operationPeriodLabel: '중첩 운영 기간',
        },
      },
    } as unknown as Program)
    expect(display.recruitmentPeriodLabel).not.toBe('중첩 모집 기간')
    expect(display.recruitmentPeriodLabel).toContain('2001')
    expect(display.operationPeriodLabel).toBe('-')
    expect(display.recruitmentStatusLifecycle).toBe('education_completed')
  })
})
