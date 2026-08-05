import { Fragment, type ReactNode } from 'react'

const BOLD_SEGMENT_PATTERN = /\*\*(.+?)\*\*/g

function parseBoldSegments(line: string, lineKey: number): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let boldIndex = 0
  const regex = new RegExp(BOLD_SEGMENT_PATTERN.source, 'g')

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index))
    }
    parts.push(<strong key={`${lineKey}-b-${boldIndex++}`}>{match[1]}</strong>)
    lastIndex = regex.lastIndex
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [line]
}

/** ContentModal `description` — `\n` 개행, `**텍스트**` 볼드(700) */
export function renderContentModalDescription(text: string): ReactNode {
  const lines = text.split('\n')

  return (
    <p className="content-modal__description-text">
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {parseBoldSegments(line, lineIndex)}
        </Fragment>
      ))}
    </p>
  )
}
