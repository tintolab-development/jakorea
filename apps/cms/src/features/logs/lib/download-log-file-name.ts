/**
 * 파일 다운로드 이력 화면 표시용 파일명 정규화.
 * 규칙 적용 전에 기록된 이력도 `[JA Korea] 도메인명_파일 이름_YYMMDD` 규칙으로 보이게 한다.
 * - 표시 전용: 서버에 저장된 값은 바꾸지 않으므로 파일명 검색은 저장값 기준이다.
 * - 사용자가 올린 원본 파일(첨부·증빙·제출 동의서 등)은 원래 이름을 유지한다.
 *   그래서 날짜 접미사가 있는 시스템 생성 엑셀/ZIP과 발급 문서(CERTIFICATE_ISSUE)만 바꾼다.
 */
const PREFIX = '[JA Korea]'

/** 규칙 적용 전 이름 → 기획 파일 이름 */
const LEGACY_LABELS: Record<string, string> = {
  '1365_봉사시간_등록_양식': '1365 봉사시간 등록 양식',
  '버그&이슈 이력': '버그,이슈 이력',
}

function toYymmdd(digits: string): string {
  return digits.length === 8 ? digits.slice(2) : digits
}

function label(name: string): string {
  return LEGACY_LABELS[name] ?? name.replace(/[/\\]/g, ',')
}

export function normalizeDownloadLogFileName(fileName: string, rawKind?: string | null): string {
  const name = fileName.trim()
  if (!name) return fileName
  const kind = rawKind?.trim().toUpperCase() ?? ''

  if (name.startsWith(PREFIX)) {
    return name.replace('버그&이슈 이력', '버그,이슈 이력')
  }

  const generated = /^(.+)_(\d{8})\.(xlsx|zip)$/i.exec(name)
  if (generated && kind === 'CLIENT_GENERATED_FILE') {
    const [, base, digits, ext] = generated
    const domain = ext.toLowerCase() === 'xlsx' ? 'CMS 어드민_' : ''
    return `${PREFIX} ${domain}${label(base)}_${toYymmdd(digits)}.${ext}`
  }

  const issued = /^(.+)_(\d{6}|\d{8})\.(pdf|zip)$/i.exec(name)
  // 발급 문서와 UJAT 교육계획서·교육일지(시스템이 PDF로 생성)
  if (issued && (kind === 'CERTIFICATE_ISSUE' || /^UJAT 교육(계획서|일지)_/.test(name))) {
    const [, base, digits, ext] = issued
    return `${PREFIX} ${label(base)}_${toYymmdd(digits)}.${ext}`
  }

  return fileName
}
