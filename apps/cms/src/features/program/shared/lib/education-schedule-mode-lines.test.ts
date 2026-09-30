import { describe, expect, it } from 'vitest'
import { swapEducationScheduleLinesForMode } from './education-schedule-mode-lines'

describe('swapEducationScheduleLinesForMode', () => {
  it('같은 모드면 바꾸지 않는다', () => {
    expect(
      swapEducationScheduleLinesForMode({
        currentMode: 'date',
        nextMode: 'date',
        currentLines: ['26년 10월 12일(월) 10:00 ~ 12:00'],
        stashedNextModeLines: [],
      })
    ).toBeNull()
  })

  it('기간 지정으로 바꾸면 현재 목록을 숨기고 빈 목록을 보여준다', () => {
    expect(
      swapEducationScheduleLinesForMode({
        currentMode: 'date',
        nextMode: 'period',
        currentLines: ['26년 10월 12일(월) 10:00 ~ 12:00'],
        stashedNextModeLines: undefined,
      })
    ).toEqual({
      stashCurrentModeLines: ['26년 10월 12일(월) 10:00 ~ 12:00'],
      nextLines: [],
    })
  })

  it('다시 날짜 지정하면 숨겼던 목록을 복구한다', () => {
    expect(
      swapEducationScheduleLinesForMode({
        currentMode: 'period',
        nextMode: 'date',
        currentLines: [],
        stashedNextModeLines: ['26년 10월 12일(월) 10:00 ~ 12:00'],
      })
    ).toEqual({
      stashCurrentModeLines: [],
      nextLines: ['26년 10월 12일(월) 10:00 ~ 12:00'],
    })
  })
})
