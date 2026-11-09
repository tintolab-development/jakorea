/**
 * UTF-8 BOM CSV — Windows Excel이 한글을 CP949로 오인하지 않도록 BOM을 붙인다.
 * 줄바꿈은 Windows Excel용 CRLF.
 */

function sanitizeFilenameBase(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 80)
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value)
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export function downloadCsv(options: {
  filenameBase: string
  headers: string[]
  rows: Array<Array<string | number | null | undefined>>
}): void {
  const lines = [
    options.headers.map(escapeCsvCell).join(','),
    ...options.rows.map(row => row.map(escapeCsvCell).join(',')),
  ]
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const stamp = new Date()
  const y = stamp.getFullYear()
  const m = String(stamp.getMonth() + 1).padStart(2, '0')
  const d = String(stamp.getDate()).padStart(2, '0')
  const h = String(stamp.getHours()).padStart(2, '0')
  const min = String(stamp.getMinutes()).padStart(2, '0')
  const s = String(stamp.getSeconds()).padStart(2, '0')
  const filename = `${sanitizeFilenameBase(options.filenameBase)}_${y}${m}${d}_${h}${min}${s}.csv`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
