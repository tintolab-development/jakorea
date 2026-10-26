import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INSTRUCTOR_PERMISSION_REVOKE_CHANNEL,
  INSTRUCTOR_PERMISSION_REVOKE_CHANNEL_TYPES,
} from './instructor-permission-revoke-channel'

describe('instructor permission revoke channel', () => {
  it('채널 선택지는 BE 계약과 같고 기본값은 기존 정책에 위임한다', () => {
    expect(INSTRUCTOR_PERMISSION_REVOKE_CHANNEL_TYPES).toEqual(['ALIMTALK', 'SMS', 'EMAIL'])
    expect(DEFAULT_INSTRUCTOR_PERMISSION_REVOKE_CHANNEL).toBeUndefined()
  })
})
