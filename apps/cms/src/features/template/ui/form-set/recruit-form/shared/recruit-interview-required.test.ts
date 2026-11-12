import { describe, expect, it } from 'vitest'
import {
  isRecruitInterviewRequiredOff,
  isRecruitInterviewRequiredOn,
  recruitInterviewRequiredRadioValue,
} from './recruit-interview-required'

describe('isRecruitInterviewRequiredOff / On', () => {
  it.each(['yes', true])('On: %j', (value) => {
    expect(isRecruitInterviewRequiredOn(value)).toBe(true)
    expect(isRecruitInterviewRequiredOff(value)).toBe(false)
    expect(recruitInterviewRequiredRadioValue(value)).toBe('yes')
  })

  it.each([undefined, null, ''])('미선택(QA-0121): %j', (value) => {
    expect(isRecruitInterviewRequiredOn(value)).toBe(false)
    expect(isRecruitInterviewRequiredOff(value)).toBe(false)
    expect(recruitInterviewRequiredRadioValue(value)).toBe('')
  })

  it.each(['no', false])('Off: %j', (value) => {
    expect(isRecruitInterviewRequiredOff(value)).toBe(true)
    expect(isRecruitInterviewRequiredOn(value)).toBe(false)
    expect(recruitInterviewRequiredRadioValue(value)).toBe('no')
  })
})
