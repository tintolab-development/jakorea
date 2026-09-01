/**
 * E2E 에러 로그 → Markdown 문서 문자열
 */

import type { E2eErrorLogEntry } from '../model/types'

function escapeMdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function formatOccurredAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', { hour12: false })
  } catch {
    return iso
  }
}

function buildByErrorCode(items: E2eErrorLogEntry[]): Array<{ errorCode: string; count: number }> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const code = item.errorCode || '(unknown)'
    counts[code] = (counts[code] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([errorCode, count]) => ({ errorCode, count }))
    .sort((a, b) => b.count - a.count || a.errorCode.localeCompare(b.errorCode))
}

/** 전체 리스트를 백엔드 전달용 Markdown으로 직렬화 */
export function formatE2eErrorLogMarkdown(items: E2eErrorLogEntry[]): string {
  const exportedAt = new Date().toLocaleString('ko-KR', { hour12: false })
  const summaries = buildByErrorCode(items)
  const lines: string[] = [
    '# E2E 백엔드 에러 로그',
    '',
    `- 내보낸 시각: ${exportedAt}`,
    `- 총 건수: ${items.length}`,
    '',
    '## 에러 코드별 건수',
    '',
  ]

  if (summaries.length === 0) {
    lines.push('_기록된 에러가 없습니다._', '')
  } else {
    for (const row of summaries) {
      lines.push(`- \`${row.errorCode}\` × ${row.count}`)
    }
    lines.push('')
  }

  lines.push('## 로그 목록', '')

  if (items.length === 0) {
    lines.push('_비어 있음_', '')
    return lines.join('\n')
  }

  lines.push(
    '| # | 발생 시각 | 상황 | 에러 코드 | HTTP | 요청 | 메시지 | traceId | route |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  )

  items.forEach((row, index) => {
    const request = `${row.method} ${row.requestPath}`
    lines.push(
      `| ${index + 1} | ${escapeMdCell(formatOccurredAt(row.occurredAt))} | ${escapeMdCell(row.situation)} | \`${escapeMdCell(row.errorCode)}\` | ${row.httpStatus ?? '—'} | ${escapeMdCell(request)} | ${escapeMdCell(row.message || '—')} | ${escapeMdCell(row.traceId || '—')} | ${escapeMdCell(row.route || '—')} |`
    )
  })

  lines.push('', '## 상세', '')

  items.forEach((row, index) => {
    lines.push(
      `### ${index + 1}. \`${row.errorCode}\` — ${formatOccurredAt(row.occurredAt)}`,
      '',
      `- **상황:** ${row.situation}`,
      `- **route:** \`${row.route || '—'}\``,
      `- **요청:** \`${row.method} ${row.requestPath}\``,
      `- **HTTP:** ${row.httpStatus ?? '—'}`,
      `- **메시지:** ${row.message || '—'}`,
      `- **traceId:** ${row.traceId || '—'}`,
      ''
    )
    if (row.requestBodyPreview) {
      lines.push('#### request body', '', '```', row.requestBodyPreview, '```', '')
    }
    if (row.responseBodyPreview) {
      lines.push('#### response body', '', '```', row.responseBodyPreview, '```', '')
    }
  })

  return `${lines.join('\n').trimEnd()}\n`
}

export function buildE2eErrorLogMdFilename(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `e2e-error-log-${y}${m}${d}-${hh}${mm}${ss}.md`
}
