import { describe, expect, it } from 'vitest'
import { formatApplicationStatusConflictMessage } from './application-status-conflict'

describe('formatApplicationStatusConflictMessage', () => {
  it('returns message for APPLICATION_STATUS_CONFLICT', () => {
    const message = formatApplicationStatusConflictMessage({
      response: {
        data: {
          error: {
            code: 'APPLICATION_STATUS_CONFLICT',
            message: '현재 상태에서는 요청한 처리를 수행할 수 없습니다.',
          },
        },
      },
    })
    expect(message).toBe('현재 상태에서는 요청한 처리를 수행할 수 없습니다.')
  })

  it('returns null for other errors', () => {
    expect(formatApplicationStatusConflictMessage(new Error('network'))).toBeNull()
  })
})
