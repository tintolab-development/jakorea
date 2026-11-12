/** 브라우저 Web Crypto로 파일 SHA-256 hex (upload-requests / confirm `checksumSha256`). */
export async function createSha256(file: Blob): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle?.digest) {
    throw new Error('이 브라우저에서는 파일 체크섬을 계산할 수 없습니다.')
  }

  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Member portal uploads always need an actual SHA-256 before issuing a presigned PUT.
 * Reuse an already-computed value (for example, from an image editor) to avoid
 * calculating large files twice, but never send missing or malformed digests.
 */
export async function resolveMemberPortalUploadSha256(
  file: Blob,
  alreadyComputed?: string,
): Promise<string> {
  const normalized = alreadyComputed?.trim()
  if (normalized) {
    if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
      throw new Error('Invalid SHA-256 checksum')
    }
    return normalized.toLowerCase()
  }
  return createSha256(file)
}
