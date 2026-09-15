/** `a | b | c` 형태의 표시 문구를 파트 배열로 분리 */
export function splitPipeSeparatedParts(value: string): string[] {
  return value
    .split('|')
    .map(part => part.trim())
    .filter(part => part.length > 0)
}
