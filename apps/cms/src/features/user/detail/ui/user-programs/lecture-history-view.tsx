import { MemberProgramLectureHistory } from '../member-program-lecture-history'
import type { RendererProps } from '../user-programs-view-renderer'

export function LectureHistoryView({ applications, loading, onRowClick }: RendererProps) {
  return (
    <MemberProgramLectureHistory
      applications={applications}
      loading={loading}
      onRowClick={onRowClick}
    />
  )
}
