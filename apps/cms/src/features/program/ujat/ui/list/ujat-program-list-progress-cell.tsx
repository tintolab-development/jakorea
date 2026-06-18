import type { Program } from '@/types/domain'
import {
  getUjatProgramListProgressLabel,
  resolveUjatProgramListProgressStatus,
  UJAT_PROGRAM_LIST_PROGRESS_COLORS,
} from '@/features/program/ujat/lib/ujat-program-list-progress'

import './ujat-program-list-progress-cell.css'

export function UjatProgramListProgressCell({ program }: { program: Program }) {
  const status = resolveUjatProgramListProgressStatus(program)
  if (!status) return <>-</>

  return (
    <span
      className="ujat-program-list-progress-cell"
      style={{ color: UJAT_PROGRAM_LIST_PROGRESS_COLORS[status] }}
    >
      {getUjatProgramListProgressLabel(status)}
    </span>
  )
}
