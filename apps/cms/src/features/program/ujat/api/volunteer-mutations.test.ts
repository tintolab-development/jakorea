import { describe, expect, it } from 'vitest'
import { mapSecondInterviewStatusToFinalResultPayload } from '@/features/program/general/api/admin-applications-service'
import { toScreeningResultNotifyFields } from '@/features/program/general/api/screening-notify-fields'
import { toScreeningNotifyFields } from '@/features/program/general/lib/application-decision-notify-timing'
import dayjs from 'dayjs'

describe('UJAT 봉사자 최종 결과 알림 필드', () => {
  it('발표일은 ON_ANNOUNCEMENT만 전달하고 scheduledAt은 넣지 않는다', () => {
    const notify = toScreeningNotifyFields('on_announcement', dayjs('2026-11-01T10:00:00+09:00'))
    expect(
      mapSecondInterviewStatusToFinalResultPayload(
        'pass',
        undefined,
        toScreeningResultNotifyFields(notify)
      )
    ).toEqual({
      result: 'PASS',
      notifyTiming: 'ON_ANNOUNCEMENT',
    })
  })

  it('직접 설정은 MANUAL + scheduledAt을 전달한다', () => {
    const at = dayjs('2026-11-01T10:00:00+09:00')
    const notify = toScreeningNotifyFields('manual', at)
    expect(
      mapSecondInterviewStatusToFinalResultPayload(
        'fail',
        '서류 미비',
        toScreeningResultNotifyFields(notify)
      )
    ).toEqual({
      result: 'FAIL',
      reason: '서류 미비',
      notifyTiming: 'MANUAL',
      // 예약 시각은 Asia/Seoul offset ISO-8601 (a66fdced0 — UTC `Z` 금지)
      scheduledAt: '2026-11-01T10:00:00+09:00',
    })
  })
})
