/** 파일명의 `/`(경로 구분자)를 `,`로 바꾼다. 예) `버그/이슈 관리` → `버그,이슈 관리` */
export function sanitizeDownloadFileName(filename: string): string {
  return filename.replace(/[/\\]/g, ',')
}

/** Asia/Seoul 달력일 YYMMDD */
function formatSeoulYymmdd(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const v = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${v.year}${v.month}${v.day}`
}

/**
 * 모든 다운로드 파일명 규칙. 이미 `[JA Korea]`로 시작하면 그대로 둔다(생성 파일).
 * 그 외(업로드 원본 등)는 `[JA Korea] {원본 이름}_YYMMDD.확장자` (YYMMDD = 내려받은 날짜, Asia/Seoul).
 * 예) `IMG_2235.PNG` → `[JA Korea] IMG_2235_261110.PNG`
 */
export function toRuleDownloadFileName(filename: string, date: Date = new Date()): string {
  const name = sanitizeDownloadFileName(filename.trim())
  if (name === '' || name.startsWith('[JA Korea]')) return name
  const dot = name.lastIndexOf('.')
  const hasExt = dot > 0 && /^[A-Za-z0-9]{1,10}$/.test(name.slice(dot + 1))
  const base = hasExt ? name.slice(0, dot) : name
  const ext = hasExt ? name.slice(dot) : ''
  return `[JA Korea] ${base}_${formatSeoulYymmdd(date)}${ext}`
}
