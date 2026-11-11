import { describe, expect, it } from 'vitest'
import type { ApplicantSessionLineInput } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { formatGeneralDetailSessionLine } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import type { InstitutionApplicationProgramBridge } from './institution-application-program-bridge'
import { formatHopeScheduleFormOptionLine } from './hope-schedule-form-option'

function session(overrides: Partial<ApplicantSessionLineInput> = {}): ApplicantSessionLineInput {
  return {
    date: '2026.11.03',
    dayOfWeek: '화',
    duration: '-',
    format: '-',
    classNum: '1지망',
    timeRange: '-',
    round: 1,
    ...overrides,
  }
}

function fixedDateBridge(
  overrides: Partial<InstitutionApplicationProgramBridge> = {}
): InstitutionApplicationProgramBridge {
  return {
    preEducationNoticeRequired: true,
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationScheduleMode: 'date',
    educationScheduleLines: ['2026.11.03(화) 10:00 ~ 12:00', '2026.11.27(금) 10:38 ~ 11:38'],
    ...overrides,
  }
}

// 예정일 줄(문자열)에는 실제 회차(sessionNo)가 없다 — 줄 입력 순서로 「N회차」를 붙이지 않는다
describe('hope-schedule-form-option', () => {
  it('날짜만 있는 신청 응답도 폼 선택지 문구(시각 포함)로 표시한다', () => {
    expect(
      formatHopeScheduleFormOptionLine(session({ date: '2026.11.03' }), fixedDateBridge())
    ).toBe('2026.11.03(화) 10:00 ~ 12:00')
    expect(
      formatHopeScheduleFormOptionLine(
        session({ date: '2026.11.27', dayOfWeek: '금', round: 2, classNum: '2지망' }),
        fixedDateBridge()
      )
    ).toBe('2026.11.27(금) 10:38 ~ 11:38')
  })

  it('line:N 선택은 해당 인덱스 선택지 문구를 쓴다', () => {
    expect(
      formatHopeScheduleFormOptionLine(
        session({ scheduleLabel: 'line:1', date: '-' }),
        fixedDateBridge()
      )
    ).toBe('2026.11.27(금) 10:38 ~ 11:38')
  })

  it('기간형 지망은 폼 고정 선택지가 아니므로 덮지 않는다', () => {
    expect(
      formatHopeScheduleFormOptionLine(
        session(),
        fixedDateBridge({
          educationScheduleMode: 'period',
          maxScheduleCount: 2,
        })
      )
    ).toBeNull()
  })

  it('목록 포맷터도 같은 폼 문구를 쓴다', () => {
    expect(
      formatGeneralDetailSessionLine(
        session({ date: '2026.11.03', timeRange: '-', scheduleLabel: '2026.11.03(화) | 1지망' }),
        fixedDateBridge(),
        { preferFormOptionLabel: true }
      )
    ).toBe('2026.11.03(화) 10:00 ~ 12:00')
  })

  it('preferFormOptionLabel이 없으면 배정 시각을 폼 문구로 덮지 않는다', () => {
    expect(
      formatGeneralDetailSessionLine(
        session({
          date: '2026.11.03',
          timeRange: '09:00~10:00',
          scheduleLabel: '2026.11.03(화) | 1지망',
        }),
        fixedDateBridge()
      )
    ).toBe('2026.11.03(화) 09:00 ~ 10:00')
  })
})
