/**
 * 브라우저 Web Crypto로 파일 SHA-256 hex를 계산합니다.
 * JABACK upload-requests / confirm 요청의 `checksumSha256`에 사용합니다.
 */
export async function createSha256(file: Blob): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle?.digest) {
    throw new Error('이 브라우저에서는 파일 체크섬을 계산할 수 없습니다.')
  }

  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}
