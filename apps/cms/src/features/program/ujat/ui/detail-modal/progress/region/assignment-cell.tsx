import type { RegionAssignmentCell } from './types'

export function RegionAssignmentCellContent({ cell }: { cell: RegionAssignmentCell }) {
  if (cell.kind === 'empty') {
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
        {cell.classLabel}
      </span>
    </span>
  )
}
