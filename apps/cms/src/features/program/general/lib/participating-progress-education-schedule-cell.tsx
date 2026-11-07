import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  formatParticipatingProgressEducationScheduleLine,
  type GeneralEducationScheduleShape,
} from '@/features/program/general/lib/participating-school-session-display'

export function ParticipatingProgressEducationScheduleCell({
  sessions,
  shape = null,
}: {
  sessions: readonly ParticipatingSchoolSession[] | null | undefined
  shape?: GeneralEducationScheduleShape | null
}) {
  const lines = (sessions ?? [])
    .map(session => formatParticipatingProgressEducationScheduleLine(session, shape))
    .filter(Boolean)
  if (lines.length === 0) return '-'
  return (
    <div className="participating-institutions-section__sessions-cell">
      {lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          className="participating-institutions-section__session-line"
        >
          {line}
        </div>
      ))}
    </div>
  )
}
