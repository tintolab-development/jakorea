/**
 * `<input accept>`는 파일 창의 기본 필터일 뿐이라 「모든 파일」로 바꾸면 우회된다.
 * 선택 결과를 같은 accept 규칙으로 다시 검사해, 허용되지 않는 파일은 목록에 넣지 않는다 (QA-0376).
 *
 * 지원 토큰: `.ext` (확장자), `type/*` (MIME 그룹), `type/subtype` (정확한 MIME).
 */

function normalizeAcceptTokens(accept: string | undefined): string[] {
  return (accept ?? '')
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(Boolean)
}

export function fileNameExtension(fileName: string): string {
  const name = fileName.trim().toLowerCase()
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot) : ''
}

export function isFileAcceptedBy(file: Pick<File, 'name' | 'type'>, accept: string | undefined): boolean {
  const tokens = normalizeAcceptTokens(accept)
  if (tokens.length === 0) return true
  const ext = fileNameExtension(file.name)
  const mime = (file.type ?? '').toLowerCase()
  return tokens.some(token => {
    if (token.startsWith('.')) return ext === token
    if (token.endsWith('/*')) return mime.startsWith(token.slice(0, -1))
    return mime === token
  })
}

export function partitionFilesByAccept<T extends Pick<File, 'name' | 'type'>>(
  files: readonly T[],
  accept: string | undefined
): { accepted: T[]; rejected: T[] } {
  const accepted: T[] = []
  const rejected: T[] = []
  for (const file of files) {
    ;(isFileAcceptedBy(file, accept) ? accepted : rejected).push(file)
  }
  return { accepted, rejected }
}

/** 안내 문구(줄 단위) — 제외한 파일명과 등록 가능한 확장자 */
export function buildRejectedFileTypeMessageLines(
  rejected: readonly Pick<File, 'name'>[],
  accept: string | undefined
): string[] {
  const names = rejected.map(file => file.name).join(', ')
  const extensions = [
    ...new Set(
      normalizeAcceptTokens(accept)
        .filter(token => token.startsWith('.'))
        .map(token => token.slice(1).toUpperCase())
    ),
  ]
  return [
    '등록할 수 없는 형식의 파일은 제외했습니다.',
    names,
    ...(extensions.length > 0 ? [`등록 가능한 형식: ${extensions.join(', ')}`] : []),
  ]
}
