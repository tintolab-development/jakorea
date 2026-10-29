/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { useEffect, useRef, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { useDeferredFieldCommit } from './use-deferred-field-commit'

afterEach(() => {
  cleanup()
})

function Field({ value, onCommit }: { value: string; onCommit: (next: string) => void }) {
  const { value: editValue, setValue, flush } = useDeferredFieldCommit(value, onCommit)
  return (
    <input
      aria-label="field"
      value={editValue}
      onChange={e => setValue(e.target.value)}
      onBlur={flush}
    />
  )
}

/** 등록 위저드처럼 단계 이탈 시점의 상위 draft를 스냅샷한다. */
function Host({ snapshots }: { snapshots: string[] }) {
  const [draft, setDraft] = useState('')
  const [step, setStep] = useState<'a' | 'b'>('a')
  const draftRef = useRef(draft)
  draftRef.current = draft
  useEffect(() => {
    if (step !== 'a') return
    return () => {
      snapshots.push(draftRef.current)
    }
  }, [step, snapshots])
  return (
    <>
      {step === 'a' ? <Field value={draft} onCommit={setDraft} /> : null}
      <button type="button" onClick={() => setStep('b')}>
        next
      </button>
    </>
  )
}

describe('useDeferredFieldCommit', () => {
  it('blur 직후 바로 단계를 떠나도 blur flush 값이 단계 이탈 시점 draft에 반영된다', () => {
    const snapshots: string[] = []
    const { getByLabelText, getByText } = render(<Host snapshots={snapshots} />)
    const input = getByLabelText('field')
    act(() => {
      fireEvent.change(input, { target: { value: '설명' } })
      fireEvent.blur(input)
      fireEvent.click(getByText('next'))
    })
    expect(snapshots).toEqual(['설명'])
  })
})
