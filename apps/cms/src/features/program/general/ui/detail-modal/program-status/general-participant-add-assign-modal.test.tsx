/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { InstructorAssignSessionOption } from '@/features/program/general/lib/instructor-assign-session-options'
import { GeneralParticipantAddAssignModal } from './general-participant-add-assign-modal'

const OPTIONS: InstructorAssignSessionOption[] = [
  { id: 's1', scheduleLabel: '2026.04.20(월) 09:30 ~ 12:20', sessionRoundLabel: '2차시', capacityLabel: '3명' },
  { id: 's2', scheduleLabel: '2026.04.27(월) 09:30 ~ 12:20', sessionRoundLabel: '2차시', capacityLabel: '2명' },
  { id: 's3', scheduleLabel: '2026.04.27(월) 13:30 ~ 15:20', sessionRoundLabel: '3차시', capacityLabel: '2명', disabled: true },
]

function Harness(props: {
  mode: 'single' | 'multiple'
  withRole?: boolean
  withTarget?: boolean
  onConfirm?: (ids: string[]) => void
  options?: InstructorAssignSessionOption[]
  confirmLoading?: boolean
}) {
  const [ids, setIds] = useState<string[]>([])
  return (
    <GeneralParticipantAddAssignModal
      open
      onCancel={() => undefined}
      title="추가 배정 안내"
      description="**[김제이]** 님을 추가 배정할 일정을 선택해 주세요."
      onConfirm={() => props.onConfirm?.(ids)}
      confirmLoading={props.confirmLoading}
      role={props.withRole ? { value: 'assistant', onChange: () => undefined } : null}
      target={
        props.withTarget
          ? { label: '기관명', placeholder: '배정할 기관을 선택해 주세요', options: [], value: null, onChange: () => undefined }
          : null
      }
      sessions={{
        label: '교육 배정일 선택',
        options: props.options ?? OPTIONS,
        value: ids,
        onChange: setIds,
        selectionMode: props.mode,
      }}
    />
  )
}

function chip(text: string) {
  return screen.getByText(text).closest('button') as HTMLButtonElement
}

describe('GeneralParticipantAddAssignModal', () => {
  afterEach(() => cleanup())

  it('개인형 봉사자(E): 대표 강사·기관 필드 없이 제목·설명·필수 라벨·취소/배정', () => {
    render(<Harness mode="single" />)
    expect(screen.getByText('추가 배정 안내')).toBeTruthy()
    expect(screen.getByText('[김제이]')).toBeTruthy()
    expect(screen.queryByText('대표 강사 지정')).toBeNull()
    expect(screen.queryByText('기관명')).toBeNull()
    expect(screen.getByText('교육 배정일 선택')).toBeTruthy()
    expect(screen.getByText('취소')).toBeTruthy()
    expect(screen.getByText('배정')).toBeTruthy()
  })

  it('기관형 강사(B 등): 대표 강사 + 기관명 필드 노출', () => {
    render(<Harness mode="multiple" withRole withTarget />)
    expect(screen.getByText('대표 강사 지정')).toBeTruthy()
    expect(screen.getByText('대표 강사')).toBeTruthy()
    expect(screen.getByText('일반 강사')).toBeTruthy()
    expect(screen.getByText('기관명')).toBeTruthy()
  })

  it('single: 다른 칩을 누르면 교체, 비활성 칩은 disabled', () => {
    const onConfirm = vi.fn()
    render(<Harness mode="single" onConfirm={onConfirm} />)
    fireEvent.click(chip('2026.04.20(월) 09:30 ~ 12:20'))
    fireEvent.click(chip('2026.04.27(월) 09:30 ~ 12:20'))
    expect(chip('2026.04.27(월) 13:30 ~ 15:20').disabled).toBe(true)
    fireEvent.click(chip('2026.04.27(월) 13:30 ~ 15:20'))
    fireEvent.click(screen.getByText('배정'))
    expect(onConfirm).toHaveBeenCalledWith(['s2'])
    expect(chip('2026.04.27(월) 09:30 ~ 12:20').getAttribute('aria-pressed')).toBe('true')
    expect(chip('2026.04.27(월) 09:30 ~ 12:20').className).toContain('paragraph-chip--selected')
  })

  it('multiple: 여러 칩 선택·해제', () => {
    const onConfirm = vi.fn()
    render(<Harness mode="multiple" onConfirm={onConfirm} />)
    fireEvent.click(chip('2026.04.20(월) 09:30 ~ 12:20'))
    fireEvent.click(chip('2026.04.27(월) 09:30 ~ 12:20'))
    fireEvent.click(chip('2026.04.20(월) 09:30 ~ 12:20'))
    fireEvent.click(chip('2026.04.20(월) 09:30 ~ 12:20'))
    fireEvent.click(screen.getByText('배정'))
    expect(onConfirm).toHaveBeenCalledWith(['s2', 's1'])
  })

  it('인원 배지는 옵션 라벨 그대로', () => {
    render(<Harness mode="single" />)
    expect(screen.getByText('3명')).toBeTruthy()
    expect(screen.getAllByText('2명')).toHaveLength(2)
  })

  it('데이터 없음 문구', () => {
    render(<Harness mode="single" options={[]} />)
    expect(screen.getByText('선택 가능한 교육 일정이 없습니다.')).toBeTruthy()
  })

  it('confirmLoading이면 배정 중복 클릭이 onConfirm을 부르지 않는다', () => {
    const onConfirm = vi.fn()
    render(<Harness mode="single" onConfirm={onConfirm} confirmLoading />)
    fireEvent.click(screen.getByText('배정').closest('button')!)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
