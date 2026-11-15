import { describe, expect, it } from 'vitest'
import { splitNotificationBodyEmphasis } from './notification-body-emphasis'

const body =
  '2026.11.13에 신규 접수된 신청자 수는 3명입니다.\n신청자 정보와 신청 내용을 확인해 주세요.'

describe('splitNotificationBodyEmphasis', () => {
  it('합산 알림은 첫 「숫자+명」만 굵게 나누고 나머지 문구·줄바꿈은 그대로 둔다', () => {
    expect(
      splitNotificationBodyEmphasis({
        body,
        target: { eventType: 'ADMIN_PROGRAM_APPLICATION_SUBMITTED' },
      })
    ).toEqual([
      { text: '2026.11.13에 신규 접수된 신청자 수는 ', bold: false },
      { text: '3명', bold: true },
      { text: '입니다.\n신청자 정보와 신청 내용을 확인해 주세요.', bold: false },
    ])
  })

  it('천 단위 쉼표가 있는 인원도 굵게 나눈다', () => {
    const segments = splitNotificationBodyEmphasis({
      body: '신청자 수는 1,234명입니다.',
      target: { eventType: 'ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY' },
    })
    expect(segments.find(segment => segment.bold)?.text).toBe('1,234명')
  })

  it('다른 알림은 강조 없이 본문 한 덩어리', () => {
    expect(
      splitNotificationBodyEmphasis({ body, target: { eventType: 'ADMIN_PROGRAM_NOTICE_CREATED' } })
    ).toEqual([{ text: body, bold: false }])
    expect(splitNotificationBodyEmphasis({ body })).toEqual([{ text: body, bold: false }])
  })

  it('합산 알림이라도 「숫자+명」이 없으면 강조하지 않는다', () => {
    expect(
      splitNotificationBodyEmphasis({
        body: '신청자 정보를 확인해 주세요.',
        target: { eventType: 'ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY' },
      })
    ).toEqual([{ text: '신청자 정보를 확인해 주세요.', bold: false }])
  })

  it('신청 기관·강사·봉사자 합산 알림도 BE 이벤트 코드로 강조하고, 기관은 「N개」를 굵게 둔다', () => {
    const segments = splitNotificationBodyEmphasis({
      body: '2026.11.13에 신규 접수된 신청 기관 수는 2개입니다.',
      target: { eventType: 'ADMIN_ORGANIZATION_APPLICATION_SUBMITTED' },
    })
    expect(segments.find(segment => segment.bold)?.text).toBe('2개')
    for (const eventType of [
      'ADMIN_INSTRUCTOR_APPLICATION_SUBMITTED',
      'ADMIN_VOLUNTEER_APPLICATION_SUBMITTED',
    ]) {
      expect(
        splitNotificationBodyEmphasis({ body, target: { eventType } }).find(s => s.bold)?.text
      ).toBe('3명')
    }
  })
})
