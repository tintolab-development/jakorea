/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParagraphDatePicker } from './paragraph-date-picker'

const START = '2026-09-01T00:00:00.000Z'
const END = '2026-09-30T00:00:00.000Z'

afterEach(() => {
  cleanup()
})

describe('ParagraphDatePicker surface sync', () => {
  it('같은 기간을 새 Dayjs 배열로 넘겨도 무한 setState가 나지 않는다', () => {
    function Host() {
      const [, bump] = useState(0)
      const range: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs(START), dayjs(END)]
      return (
        <div>
          <button type="button" onClick={() => bump(n => n + 1)}>
            bump
          </button>
          <ParagraphDatePicker
            mode="single"
            presetMode="period"
            value={null}
            suppressAutoTodayWhenEmpty
            appliedSurfaceRange={range}
            appliedSurfaceWithTime={false}
            onChange={() => bump(n => n + 1)}
            onRangeChange={() => bump(n => n + 1)}
          />
        </div>
      )
    }

    render(<Host />)
    expect(() => {
      act(() => {
        for (let i = 0; i < 20; i += 1) {
          document.querySelector('button')?.click()
        }
      })
    }).not.toThrow()
    expect(document.querySelector('.paragraph-date-picker')).not.toBeNull()
  })

  it('빈 날짜형에서 인라인 onChange가 바뀌어도 오늘 채우기는 한 번만 호출한다', () => {
    const onChange = vi.fn()
    function Host() {
      const [, bump] = useState(0)
      return (
        <div>
          <button type="button" onClick={() => bump(n => n + 1)}>
            bump
          </button>
          <ParagraphDatePicker
            mode="single"
            presetMode="date"
            value={null}
            onChange={() => {
              onChange()
              bump(n => n + 1)
            }}
          />
        </div>
      )
    }

    render(<Host />)
    expect(onChange).toHaveBeenCalledTimes(1)
    act(() => {
      document.querySelector('button')?.click()
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
