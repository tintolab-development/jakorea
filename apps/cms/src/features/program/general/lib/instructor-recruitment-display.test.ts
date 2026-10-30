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
