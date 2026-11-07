/** @vitest-environment jsdom */
/**
 * 공통 추가 배정 UI 회귀 — A(기관 상세: 일반·1사1교 공용 SchoolDetailAddInstructorAssignModal)
 * · B(강사 상세: 일반·1사1교 공용 AssignGuideModal)
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { InstructorAssignSessionOption } from '@/features/program/general/lib/instructor-assign-session-options'
import { INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD } from '@/features/program/general/lib/institution-select-assign'
import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import { SchoolDetailAddInstructorAssignModal } from './school-detail-add-instructor-assign-modal'
import { AssignGuideModal } from './assign-guide-modal'

// antd Form(Grid) 반응형 훅용 jsdom 폴리필
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

const OPTIONS: InstructorAssignSessionOption[] = [
  { id: 's1', scheduleLabel: '2026.04.20(월) 09:30 ~ 12:20', sessionRoundLabel: '2차시', capacityLabel: '3명' },
  { id: 's2', scheduleLabel: '2026.04.27(월) 09:30 ~ 12:20', sessionRoundLabel: '2차시', capacityLabel: '2명' },
  { id: 's3', scheduleLabel: '2026.04.27(월) 13:30 ~ 15:20', sessionRoundLabel: '3차시', capacityLabel: '2명', disabled: true },
]

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>
}
const chip = (text: string) => screen.getByText(text).closest('button') as HTMLButtonElement

describe('A: SchoolDetailAddInstructorAssignModal (일반·1사1교 기관 상세)', () => {
  afterEach(() => cleanup())

  it('Figma 3번: 제목·설명·필드·배정 버튼, 칩 다중 선택·비활성 유지', () => {
    render(
      wrap(
        <SchoolDetailAddInstructorAssignModal
          open
          onCancel={() => undefined}
          programId="1"
          schoolId="sch1"
          schoolName="JA초등학교"
          instructorOptions={[{ value: '11', label: '김제이' } as never]}
          assignmentSessionOptions={OPTIONS}
          onAdd={() => undefined}
        />
      )
    )
    expect(screen.getByText('강사 추가 배정 안내')).toBeTruthy()
    expect(screen.getByText('[JA초등학교]')).toBeTruthy()
    expect(screen.getByText(/추가 배정할 강사님을 선택해 주세요\./)).toBeTruthy()
    expect(screen.getByText('대표 강사 지정')).toBeTruthy()
    expect(screen.getByText('강사명')).toBeTruthy()
    expect(screen.getByText('교육 배정일 선택')).toBeTruthy()
    expect(screen.getByText('배정')).toBeTruthy()
    expect(screen.queryByText('강사 배정')).toBeNull()
    fireEvent.click(chip('2026.04.20(월) 09:30 ~ 12:20'))
    fireEvent.click(chip('2026.04.27(월) 09:30 ~ 12:20'))
    expect(chip('2026.04.20(월) 09:30 ~ 12:20').getAttribute('aria-pressed')).toBe('true')
    expect(chip('2026.04.27(월) 09:30 ~ 12:20').getAttribute('aria-pressed')).toBe('true')
    expect(chip('2026.04.27(월) 13:30 ~ 15:20').disabled).toBe(true)
  })
})

function GuideHarness({ onConfirm }: { onConfirm: (p: unknown) => boolean }) {
  const [ids, setIds] = useState<string[]>([])
  const [role, setRole] = useState<InstructorRoleKey>('assistant')
  return (
    <AssignGuideModal
      open
      instructorName="김제이"
      institutionOptions={[{ value: 'sch1', label: 'JA초등학교' }]}
      selectedInstitutionId="sch1"
      role={role}
      sessionOptions={OPTIONS}
      selectedSessionIds={ids}
      currentCount={1}
      requiredCount={4}
      onInstitutionChange={() => undefined}
      onRoleChange={setRole}
      onSessionIdsChange={setIds}
      onCancel={() => undefined}
      onConfirm={onConfirm}
      onComplete={() => undefined}
    />
  )
}

describe('B: AssignGuideModal (일반·1사1교 강사 상세)', () => {
  afterEach(() => cleanup())

  it('Figma 2번 선택 단계 → 기존 기관 선택 배정 안내 → onConfirm(기존 알림 payload)', async () => {
    const onConfirm = vi.fn(() => true)
    render(wrap(<GuideHarness onConfirm={onConfirm} />))
    expect(screen.getByText('기관 추가 배정 안내')).toBeTruthy()
    expect(screen.getByText(/추가 배정할 기관을 선택해 주세요\./)).toBeTruthy()
    expect(screen.getByText('기관명')).toBeTruthy()
    fireEvent.click(chip('2026.04.20(월) 09:30 ~ 12:20'))
    fireEvent.click(chip('2026.04.27(월) 09:30 ~ 12:20'))
    fireEvent.click(screen.getByText('배정').closest('button')!)
    await waitFor(() => expect(screen.getByText('기관 선택 배정 안내')).toBeTruthy())
    const buttons = screen.getAllByText('배정')
    fireEvent.click(buttons[buttons.length - 1]!.closest('button')!)
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
    expect(onConfirm).toHaveBeenCalledWith(INSTITUTION_SELECT_ASSIGN_DEFAULT_NOTIFY_PAYLOAD)
  })
})
