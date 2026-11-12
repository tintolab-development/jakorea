import { describe, expect, it } from 'vitest'
import { parsePreferredLectureScheduleLine } from './gemini-institution-preferred-lecture-schedule-cell'

describe('parsePreferredLectureScheduleLine', () => {
  it('parses Figma datetime | session format', () => {
    expect(
      parsePreferredLectureScheduleLine('1지망 : 2026.01.09(금) 09:00 ~ 11:20 | 2차시')
    ).toEqual({
      preference: '1지망',
      datetime: '2026.01.09(금) 09:00 ~ 11:20',
      session: '2차시',
    })
  })

  it('parses legacy date | clock(session) format', () => {
    expect(
      parsePreferredLectureScheduleLine('1지망 : 2026.01.09(금) | 15:30~16:40(2차시)')
    ).toEqual({
      preference: '1지망',
      datetime: '2026.01.09(금) 15:30 ~ 16:40',
      session: '2차시',
    })
  })

  it('normalizes spaced dot dates from server text', () => {
    expect(
      parsePreferredLectureScheduleLine('1지망 : 2026. 11. 25(수) 09:00 ~ 10:00 | 1차시')
    ).toEqual({
      preference: '1지망',
      datetime: '2026.11.25(수) 09:00 ~ 10:00',
      session: '1차시',
    })
  })

  it('keeps a line without session', () => {
    expect(parsePreferredLectureScheduleLine('1지망 : 2026.01.09(금) 09:00 ~ 11:20')).toEqual({
      preference: '1지망',
      datetime: '2026.01.09(금) 09:00 ~ 11:20',
      session: '',
    })
  })
})
