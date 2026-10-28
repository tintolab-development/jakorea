/**
 * UJAT 서버의 학년·반 라벨을 CMS 표시용 문구로 정규화한다.
 *
 * 서버의 canonical 식별값/저장값은 변경하지 않고 화면에 표시할 때만 사용한다.
 * 과거 슬롯에는 `3-1`, `3 1반`, `3학년 1`처럼 저장된 값이 남아 있을 수 있다.
 */
export function formatUjatGradeClassDisplayLabel(
  value: string | null | undefined
): string {
  const raw = value?.trim().replace(/\s+/g, ' ')
  if (!raw) return '-'

  const koreanLabel = raw.match(/^(\d+)\s*학년\s*(\d+)\s*반?$/)
  if (koreanLabel) {
    return `${koreanLabel[1]}학년 ${koreanLabel[2]}반`
  }

  const separatedNumbers = raw.match(/^(\d+)\s*[-/:|]\s*(\d+)\s*반?$/)
  if (separatedNumbers) {
    return `${separatedNumbers[1]}학년 ${separatedNumbers[2]}반`
  }

  const spacedNumbers = raw.match(/^(\d+)\s+(\d+)\s*반?$/)
  if (spacedNumbers) {
    return `${spacedNumbers[1]}학년 ${spacedNumbers[2]}반`
  }

  return raw
}

export function formatUjatGradeClassDisplayLabelFromParts(
  grade: string | null | undefined,
  className: string | null | undefined
): string {
  const gradeValue = grade?.trim()
  const classValue = className?.trim()
  if (!gradeValue && !classValue) return '-'
  if (!gradeValue) return formatUjatGradeClassDisplayLabel(classValue)
  if (!classValue) return formatUjatGradeClassDisplayLabel(gradeValue)
  return formatUjatGradeClassDisplayLabel(`${gradeValue} ${classValue}`)
}
