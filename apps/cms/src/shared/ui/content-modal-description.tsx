import { Fragment, type ReactNode } from 'react'

type BoldToken = {
  start: number
  end: number
  nodes: ReactNode[]
}

/**
 * `**[마스킹**이름]**` / `[**마스킹**이름**]` 처럼 이름 안의 `*`는 닫힘으로 보지 않는다.
 * 대괄호가 없는 `**강조**`는 기존처럼 가장 가까운 `**` 쌍을 쓴다.
 */
export function parseContentModalDescriptionLine(line: string, lineKey = 0): ReactNode[] {
  const parts: ReactNode[] = []
  let cursor = 0
  let boldIndex = 0

  while (cursor < line.length) {
    const token = findNextBoldToken(line, cursor, lineKey, boldIndex)
    if (token == null) {
      parts.push(line.slice(cursor))
      break
    }
    if (token.start > cursor) {
      parts.push(line.slice(cursor, token.start))
    }
    parts.push(...token.nodes)
    boldIndex += 1
    cursor = token.end
  }

  return parts.length > 0 ? parts : [line]
}

function findNextBoldToken(
  line: string,
  from: number,
  lineKey: number,
  boldIndex: number
): BoldToken | null {
  const key = `${lineKey}-b-${boldIndex}`
  const tokens: BoldToken[] = []

  const wrapStart = line.indexOf('**[', from)
  if (wrapStart >= 0) {
    const close = line.indexOf(']**', wrapStart + 3)
    if (close >= 0) {
      tokens.push({
        start: wrapStart,
        end: close + 3,
        nodes: [<strong key={key}>{line.slice(wrapStart + 2, close + 1)}</strong>],
      })
    }
  }

  const innerStart = line.indexOf('[**', from)
  if (innerStart >= 0) {
    const close = line.indexOf('**]', innerStart + 3)
    if (close >= 0) {
      tokens.push({
        start: innerStart,
        end: close + 3,
        nodes: ['[', <strong key={key}>{line.slice(innerStart + 3, close)}</strong>, ']'],
      })
    }
  }

  const plainStart = line.indexOf('**', from)
  if (plainStart >= 0) {
    const close = line.indexOf('**', plainStart + 2)
    if (close >= 0) {
      tokens.push({
        start: plainStart,
        end: close + 2,
        nodes: [<strong key={key}>{line.slice(plainStart + 2, close)}</strong>],
      })
    }
  }

  if (tokens.length === 0) return null
  tokens.sort((left, right) => left.start - right.start || right.end - left.end)
  return tokens[0] ?? null
}

function normalizeDescriptionNewlines(text: string): string {
  return text.replace(/\\n/g, '\n')
}

/**
 * ContentModal `description` / CmsModal `content` — `\n`(실제 개행·리터럴) 줄바꿈, `**텍스트**` 볼드(700)
 */
export function renderContentModalDescription(
  text: string,
  className = 'content-modal__description-text',
): ReactNode {
  const lines = normalizeDescriptionNewlines(text).split('\n')

  return (
    <p className={className}>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {parseContentModalDescriptionLine(line, lineIndex)}
        </Fragment>
      ))}
    </p>
  )
}
