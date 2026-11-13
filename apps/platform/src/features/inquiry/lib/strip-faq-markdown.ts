/** FAQ 본문에 남은 마크다운 표식을 화면용 일반 텍스트로 만든다. */
export function stripFaqMarkdown(value: string): string {
  return value
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^[ \t]*[-*][ \t]+/gm, '')
    .trim()
}
