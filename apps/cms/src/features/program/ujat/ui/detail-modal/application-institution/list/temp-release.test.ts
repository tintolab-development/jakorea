import { describe, expect, it, vi } from 'vitest'
import { buildUjatTempReleaseResultAlert, releaseUjatTemporarySchedules } from './temp-release'

function apiError(status: number, code: string, message: string) {
  return { response: { status, data: { success: false, error: { code, message } } } }
}

describe('releaseUjatTemporarySchedules', () => {
  it('기관별로 slots=[]를 보내고 409는 서버 메시지로 실패 처리한다', async () => {
    const put = vi.fn(async (_programId: string, applicationId: string) => {
      if (applicationId === 'b') {
        throw apiError(
          409,
          'UJAT_TEMPORARY_SCHEDULE_HAS_VOLUNTEER_ASSIGNMENTS',
          '봉사자 배정이 남아 있어 임시 일정을 해제할 수 없습니다.'
        )
      }
      return { slots: [], temporaryAssignmentStatus: null }
    })

    const results = await releaseUjatTemporarySchedules(
      '186330',
      [
        { id: 'a', name: 'A초' },
        { id: 'b', name: 'B초' },
      ],
      put
    )

    expect(put).toHaveBeenNthCalledWith(1, '186330', 'a', { slots: [] })
    expect(put).toHaveBeenNthCalledWith(2, '186330', 'b', { slots: [] })
    expect(results).toEqual([
      { id: 'a', name: 'A초', ok: true },
      {
        id: 'b',
        name: 'B초',
        ok: false,
        message: '봉사자 배정이 남아 있어 임시 일정을 해제할 수 없습니다.',
      },
    ])

    const alert = buildUjatTempReleaseResultAlert(results)
    expect(alert.title).toBe('해제 결과')
    expect(alert.content).toContain('해제 1건 · 실패 1건')
    expect(alert.content).toContain('· B초: 봉사자 배정이 남아 있어 임시 일정을 해제할 수 없습니다.')
  })

  it('모두 성공하면 해제 건수만 안내한다', () => {
    expect(
      buildUjatTempReleaseResultAlert([
        { id: 'a', name: 'A초', ok: true },
        { id: 'b', name: 'B초', ok: true },
      ])
    ).toEqual({ title: '안내', content: '2개 기관의 임시 배정이 해제되었습니다.' })
  })
})
