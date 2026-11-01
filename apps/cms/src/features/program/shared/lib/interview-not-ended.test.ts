import { describe, expect, it } from 'vitest'
import {
  INTERVIEW_RESULT_NOT_ENDED_ALERT,
  readInterviewDecisionErrorAlert,
  shouldSkipLocalApiErrorAlert,
} from './interview-not-ended'

describe('readInterviewDecisionErrorAlert', () => {
  it('uses error.details.title and fixed INTERVIEW_NOT_ENDED body', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '면접이 아직 종료되지 않았습니다.',
          detail: '면접이 아직 종료되지 않았습니다.',
          error: {
            code: 'INTERVIEW_NOT_ENDED',
            message: '면접이 아직 종료되지 않았습니다.',
            detail: '면접이 아직 종료되지 않았습니다.',
            details: { title: '면접 결과 처리 안내' },
          },
        },
      },
    }
    expect(readInterviewDecisionErrorAlert(error)).toEqual(INTERVIEW_RESULT_NOT_ENDED_ALERT)
  })

  it('skips local alert when the global interceptor already showed it', () => {
    expect(shouldSkipLocalApiErrorAlert({ __cmsGlobalErrorAlertShown: true })).toBe(true)
    expect(shouldSkipLocalApiErrorAlert(new Error('fail'))).toBe(false)
  })
})
