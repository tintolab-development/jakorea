import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/general-detail-session-line.css'
import './institution-application-tab.css'

function parsePreferredLectureScheduleLine(line: string): {
  preference: string
  date: string
  time: string
} | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const colonIndex = trimmed.indexOf(':')
  if (colonIndex === -1) return null

  const preference = trimmed.slice(0, colonIndex).trim()
  const rest = trimmed.slice(colonIndex + 1).trim()
  const pipeIndex = rest.indexOf('|')
  if (pipeIndex === -1) return null

  const date = rest.slice(0, pipeIndex).trim()
  const time = rest.slice(pipeIndex + 1).trim()
  if (!date || !time) return null

  return { preference, date, time }
}

export function GeminiInstitutionPreferredLectureScheduleCell({ value }: { value: string }) {
  const lines = value
    .split('\n')
    .map(parsePreferredLectureScheduleLine)
    .filter((line): line is NonNullable<typeof line> => line != null)

  if (lines.length === 0) return <>-</>

  return (
    <div className="gemini-institution-application-tab__schedule">
      {lines.map((line, index) => (
        <div
          key={`${line.preference}-${index}`}
          className="gemini-institution-application-tab__schedule-line general-detail-session-line"
        >
          <span className="gemini-institution-application-tab__schedule-preference">
            {line.preference} :
          </span>
          <ProgramDetailTdSegmentWrap>
            {withProgramDetailTdDivider([line.date, line.time])}
          </ProgramDetailTdSegmentWrap>
        </div>
      ))}
    </div>
  )
}
