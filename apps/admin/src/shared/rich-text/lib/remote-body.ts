/** Homepage Admin 본문 API `body` @maxLength 100000 */
export const REMOTE_RICH_TEXT_BODY_MAX_LENGTH = 100_000

const DATA_SRC = /src\s*=\s*(['"])\s*data:/i

/** remote 저장 전 본문 검사. 문제 없으면 null */
export function getRemoteRichTextBodyError(html: string): string | null {
  if (DATA_SRC.test(html)) {
    return '본문 이미지는 파일로 삽입해야 저장됩니다. 이미지를 다시 넣어 주세요.'
  }
  if (html.length > REMOTE_RICH_TEXT_BODY_MAX_LENGTH) {
    return '본문이 너무 깁니다. 이미지를 줄이거나 나눠 저장해 주세요.'
  }
  return null
}
