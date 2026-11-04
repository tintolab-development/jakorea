/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RegionAssignmentCellContent } from './assignment-cell'

afterEach(() => cleanup())

describe('RegionAssignmentCellContent', () => {
  it('1인 배정 학급은 민트 클래스를 쓴다', () => {
    render(
      <RegionAssignmentCellContent
        cell={{ kind: 'assigned', classLabel: '3학년 1반', isSolo: true }}
      />
    )
    expect(screen.getByText('3학년 1반').className).toContain(
      'ujat-region-assignment-table__class-label--solo'
    )
  })

  it('재배정 필요는 빨간 텍스트가 민트보다 우선한다', () => {
    render(
      <RegionAssignmentCellContent
        cell={{
          kind: 'assigned',
          classLabel: '3학년 1반',
          isSolo: true,
          isInvalidAssignment: true,
        }}
      />
    )
    const className = screen.getByText('3학년 1반').className
    expect(className).toContain('ujat-region-assignment-table__class-label--invalid')
    expect(className).not.toContain('ujat-region-assignment-table__class-label--solo')
  })

  it('미배정 칸은 하이픈만 보여 준다', () => {
    render(<RegionAssignmentCellContent cell={{ kind: 'empty' }} />)
    expect(screen.getByText('-')).toBeTruthy()
  })
})
