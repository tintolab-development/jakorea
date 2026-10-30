import { describe, expect, it } from 'vitest'
import {
  isRecruitInterviewRequiredOff,
  isRecruitInterviewRequiredOn,
} from './recruit-interview-required'

describe('isRecruitInterviewRequiredOff / On', () => {
  it.each([undefined, null, '', 'yes', true])('On: %j', (value) => {
    expect(isRecruitInterviewRequiredOn(value)).toBe(true)
    expect(isRecruitInterviewRequiredOff(value)).toBe(false)
  })

  it.each(['no', false])('Off: %j', (value) => {
    expect(isRecruitInterviewRequiredOff(value)).toBe(true)
    expect(isRecruitInterviewRequiredOn(value)).toBe(false)
  })
})
