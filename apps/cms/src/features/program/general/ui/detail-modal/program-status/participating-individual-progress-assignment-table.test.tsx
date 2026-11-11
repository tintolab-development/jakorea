// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ParticipatingIndividualProgressAssignmentParticipantRow } from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import { ParticipatingIndividualProgressAssignmentTable } from './participating-individual-progress-assignment-table'

// antd Table — jsdom에 없는 브라우저 API
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
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

afterEach(() => cleanup())

function row(
  id: string,
  overrides: Partial<ParticipatingIndividualProgressAssignmentParticipantRow>
): ParticipatingIndividualProgressAssignmentParticipantRow {
  return {
    id,
    participantId: id,
    name: `참여자 ${id}`,
    genderBirthLabel: '-',
    affiliationGradeLabel: '-',
    affiliation: '-',
    educationGrade: '-',
    submission: { kind: 'not_submitted' },
    remarkKind: 'none',
    ...overrides,
  } as ParticipatingIndividualProgressAssignmentParticipantRow
}

const submitted = {
  kind: 'submitted',
  files: [],
  items: [],
  fileName: '',
  href: '#',
} as unknown as ParticipatingIndividualProgressAssignmentParticipantRow['submission']

describe('과제 관리 피드백 열 (BE N7)', () => {
  it('제출 행은 활성 — hasFeedback이면 「피드백 보기」, 아니면 「피드백 작성」. 미제출 행은 버튼 없음', () => {
    render(
      <ParticipatingIndividualProgressAssignmentTable
        rows={[
          row('1', {
            submission: submitted,
            assignmentFormResponseId: 93071,
            assignmentFeedbackFieldsProvided: true,
            assignmentHasFeedback: true,
          }),
          row('2', {
            submission: submitted,
            assignmentFormResponseId: 93072,
            assignmentFeedbackFieldsProvided: true,
            assignmentHasFeedback: false,
          }),
          row('3', { assignmentFeedbackFieldsProvided: true, assignmentHasFeedback: false }),
        ]}
        onViewSurveyResponse={vi.fn()}
        onOpenFeedback={vi.fn()}
      />
    )
    const view = screen.getByRole('button', { name: '피드백 보기' })
    const write = screen.getByRole('button', { name: '피드백 작성' })
    expect((view as HTMLButtonElement).disabled).toBe(false)
    expect((write as HTMLButtonElement).disabled).toBe(false)
    // 미제출 행(3) 버튼 없음 — 피드백 버튼은 제출 행 2개뿐
    expect(screen.getAllByRole('button', { name: /피드백/ })).toHaveLength(2)
  })

  it('구버전 응답(필드 없음)은 기존처럼 비활성 버튼', () => {
    render(
      <ParticipatingIndividualProgressAssignmentTable
        rows={[row('1', { submission: submitted })]}
        onViewSurveyResponse={vi.fn()}
        onOpenFeedback={vi.fn()}
      />
    )
    expect((screen.getByRole('button', { name: '피드백 작성' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
