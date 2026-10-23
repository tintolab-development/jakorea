/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DirectUnavailableDateAddButton } from './direct-unavailable-date-add-button'

afterEach(() => {
  cleanup()
})

describe('DirectUnavailableDateAddButton', () => {
  it('마운트·리렌더에서 부모 appliedDates를 다시 쓰지 않는다', () => {
    const onApplyDatesChange = vi.fn()
    function Host() {
      const [, bump] = useState(0)
      return (
        <div>
          <button type="button" onClick={() => bump(n => n + 1)}>
            bump
          </button>
          <DirectUnavailableDateAddButton
            appliedDates={['2026-01-01', '2026-09-10']}
            onApplyDatesChange={dates => {
              onApplyDatesChange(dates)
              bump(n => n + 1)
            }}
            disabledDate={date => date.isSame(dayjs('2026-01-01'), 'day')}
          />
        </div>
      )
    }

    render(<Host />)
    expect(onApplyDatesChange).not.toHaveBeenCalled()
    act(() => {
      for (let i = 0; i < 20; i += 1) {
        document.querySelector('button')?.click()
      }
    })
    expect(onApplyDatesChange).not.toHaveBeenCalled()
  })

  it('부모가 같은 날짜 배열을 계속 되돌려도 setState 루프가 나지 않는다', () => {
    const onApplyDatesChange = vi.fn()
    const stale = ['2026-01-01', '2026-09-10']
    function Host() {
      const [tick, setTick] = useState(0)
      return (
        <div>
          <span>{tick}</span>
          <DirectUnavailableDateAddButton
            appliedDates={stale}
            onApplyDatesChange={dates => {
              onApplyDatesChange(dates)
              setTick(n => n + 1)
            }}
            disabledDate={() => tick % 2 === 0}
          />
        </div>
      )
    }

    render(<Host />)
    expect(onApplyDatesChange).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('0')
  })
})
