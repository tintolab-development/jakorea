import type { RegionAssignmentCell } from './types'
import { formatUjatGradeClassDisplayLabel } from '@/features/program/ujat/lib/ujat-grade-class-display'

export function RegionAssignmentCellContent({ cell }: { cell: RegionAssignmentCell }) {
  if (cell.kind === 'empty') {
    if (cell.blockedEmpty) {
      return (
        <span className="ujat-region-assignment-table__assignment">
          <span className="ujat-region-assignment-table__unavailable-badge">불가</span>
          {cell.substituteName ? (
            <span className="ujat-region-assignment-table__substitute">
              대체 {cell.substituteName}
            </span>
          ) : null}
        </span>
      )
    }
    return <span className="ujat-region-assignment-table__empty">-</span>
  }

  return (
    <span className="ujat-region-assignment-table__assignment">
      {cell.isAttendanceManager ? (
        <span className="ujat-region-assignment-table__attendance-badge">출결</span>
      ) : null}
      <span
        className={[
          'ujat-region-assignment-table__class-label',
          cell.isSolo ? 'ujat-region-assignment-table__class-label--solo' : '',
          cell.isInvalidAssignment ? 'ujat-region-assignment-table__class-label--invalid' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatUjatGradeClassDisplayLabel(cell.classLabel)}
      </span>
    </span>
  )
}
