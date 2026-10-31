import { describe, expect, it } from 'vitest'
import { parseVolunteerApplicationNumericId } from './volunteer-application-id'

describe('parseVolunteerApplicationNumericId', () => {
  it('원격 신청 id만 숫자로 반환한다', () => {
    expect(parseVolunteerApplicationNumericId('1842')).toBe(1842)
    expect(parseVolunteerApplicationNumericId(' 7 ')).toBe(7)
  })

  it('mock 행 id·비숫자는 null이다', () => {
    expect(parseVolunteerApplicationNumericId('h1-vol-kim-minto')).toBeNull()
    expect(parseVolunteerApplicationNumericId('')).toBeNull()
    expect(parseVolunteerApplicationNumericId('0')).toBeNull()
    expect(parseVolunteerApplicationNumericId('-1')).toBeNull()
    expect(parseVolunteerApplicationNumericId('12.5')).toBeNull()
  })
})
