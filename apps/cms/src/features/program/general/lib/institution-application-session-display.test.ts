import { describe, expect, it } from 'vitest'
import {
  formatInstitutionApplicationScheduleRowLabel,
  getInstitutionApplicationSessionsTableSlice,
  resolveInstitutionApplicationSessionPeriodPart,
  shouldShowInstitutionApplicationDetailScheduleSection,
  shouldShowInstitutionApplicationSessionsColumn,
} from './institution-application-session-display'

const baseSession = {
  date: '2026.04.20',
  dayOfWeek: '월',
  duration: '3시간',
  format: '오프라인',
  classNum: '3차시',
  timeRange: '09:30~12:20',
  round: 3,
}

describe('shouldShowInstitutionApplicationSessionsColumn', () => {
  it('일정형 + 복수 회차이면 열을 숨긴다', () => {
    expect(
      shouldShowInstitutionApplicationSessionsColumn({
        educationStructure: 'schedule',
        sessionRound: 'multi',
        educationScheduleMode: 'period',
        preEducationNoticeRequired: true,
      })
    ).toBe(false)
  })
})

describe('shouldShowInstitutionApplicationDetailScheduleSection', () => {
  const hiddenBridge = {
    educationStructure: 'curriculum' as const,
    sessionRound: 'single' as const,
    educationScheduleMode: 'date' as const,
    educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20', '26년 4월 20일(월) 13:00 ~ 15:50'],
    preEducationNoticeRequired: true,
  }

  it('폼 단락 숨김 유형이어도 제출된 sessions가 있으면 상세 섹션을 노출한다', () => {
    expect(
      shouldShowInstitutionApplicationDetailScheduleSection(hiddenBridge, {
        sessions: [{ round: 1, date: '2026.04.20', dayOfWeek: '월', classNum: '1교시', timeRange: '09:30~12:20' }],
      })
    ).toBe(true)
  })

  it('제출 데이터가 없고 폼 단락 숨김 유형이면 상세 섹션도 숨긴다', () => {
    expect(shouldShowInstitutionApplicationDetailScheduleSection(hiddenBridge, {})).toBe(false)
  })

  it('기간 지정형이면 제출 데이터 없어도 상세 섹션을 노출한다', () => {
    expect(
      shouldShowInstitutionApplicationDetailScheduleSection(
        {
          educationStructure: 'curriculum',
          sessionRound: 'single',
          educationScheduleMode: 'period',
          preEducationNoticeRequired: true,
        },
        {}
      )
    ).toBe(true)
  })
})

describe('formatInstitutionApplicationScheduleRowLabel', () => {
  it('날짜 선택(기간)형이면 N지망 라벨을 사용한다', () => {
    expect(
      formatInstitutionApplicationScheduleRowLabel(2, {
        educationScheduleMode: 'period',
        preEducationNoticeRequired: true,
      })
    ).toBe('2지망')
  })

  it('날짜 지정형이면 희망 일정 NN 라벨을 사용한다', () => {
    expect(
      formatInstitutionApplicationScheduleRowLabel(1, {
        educationScheduleMode: 'date',
        preEducationNoticeRequired: true,
      })
    ).toBe('희망 일정 01')
    expect(
      formatInstitutionApplicationScheduleRowLabel(2, {
        educationScheduleMode: 'date',
        preEducationNoticeRequired: true,
      })
    ).toBe('희망 일정 02')
  })

  it('브리지가 없으면 날짜 지정형 라벨을 기본으로 사용한다', () => {
    expect(formatInstitutionApplicationScheduleRowLabel(3, null)).toBe('희망 일정 03')
  })
})

describe('resolveInstitutionApplicationSessionPeriodPart', () => {
  it('커리큘럼형 복수 회차 + 기간 지정이면 차시를 노출한다', () => {
    expect(
      resolveInstitutionApplicationSessionPeriodPart(baseSession, {
        educationStructure: 'curriculum',
        sessionRound: 'multi',
        educationScheduleMode: 'period',
        preEducationNoticeRequired: true,
      })
    ).toBe('3차시')
  })

  it('일정형 단일 회차 + 기간 지정이면 회차를 노출한다', () => {
    expect(
      resolveInstitutionApplicationSessionPeriodPart({ ...baseSession, round: 2 }, {
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'period',
        preEducationNoticeRequired: true,
      })
    ).toBe('2회차')
  })

  it('고정 일정 선택(기간 지정 preferred 미사용)이면 차시·회차를 숨긴다', () => {
    expect(
      resolveInstitutionApplicationSessionPeriodPart(baseSession, {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        preEducationNoticeRequired: true,
      })
    ).toBeNull()
  })
})

describe('getInstitutionApplicationSessionsTableSlice', () => {
  it('4개 이상이면 2개 + 외 N개', () => {
    const sessions = [1, 2, 3, 4].map(round => ({ ...baseSession, round }))
    expect(getInstitutionApplicationSessionsTableSlice(sessions)).toEqual({
      displaySessions: sessions.slice(0, 2),
      restCount: 2,
    })
  })

  it('3개 이하면 전부 노출', () => {
    const sessions = [1, 2, 3].map(round => ({ ...baseSession, round }))
    expect(getInstitutionApplicationSessionsTableSlice(sessions)).toEqual({
      displaySessions: sessions,
      restCount: 0,
    })
  })
})
