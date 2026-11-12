import { describe, expect, it } from 'vitest'
import { formatUjatVolunteerBirthDateAndAge } from './ujat-volunteer-screening-constants'

describe('formatUjatVolunteerBirthDateAndAge', () => {
  it('서버 마스킹 yyyy-**-**는 yyyy.**.** (만 N세)로 보여준다', () => {
    expect(formatUjatVolunteerBirthDateAndAge('2003-**-**', 21)).toBe('2003.**.** (만 21세)')
  })

  it('나이 0(모름)이면 나이를 붙이지 않는다', () => {
    expect(formatUjatVolunteerBirthDateAndAge('2003-**-**', 0)).toBe('2003.**.**')
  })

  it('원문(yyyy-MM-dd·yyyy.MM.dd)은 yyyy. MM. dd (만 N세)로 보여준다', () => {
    expect(formatUjatVolunteerBirthDateAndAge('2003-05-12', 21)).toBe('2003. 05. 12 (만 21세)')
    expect(formatUjatVolunteerBirthDateAndAge('2003.05.12', 21)).toBe('2003. 05. 12 (만 21세)')
  })

  it('빈 값·대시는 —, 연도를 읽을 수 없는 값은 서버 값을 그대로 둔다', () => {
    expect(formatUjatVolunteerBirthDateAndAge('', 0)).toBe('—')
    expect(formatUjatVolunteerBirthDateAndAge('-', 0)).toBe('—')
    expect(formatUjatVolunteerBirthDateAndAge('****-**-**', 0)).toBe('****-**-**')
  })
})
