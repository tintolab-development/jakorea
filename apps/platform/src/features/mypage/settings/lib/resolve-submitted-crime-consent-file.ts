const FALLBACK_FILE_NAME = '성범죄 경력 조회 동의서'

export type SubmittedCrimeConsentFileSource = {
  content?: string
  signedFileObjectId?: number
  evidenceFileObjectId?: number
  evidenceOriginalFileName?: string
  filledDocument?: {
    evidenceFileObjectId?: number
    evidenceOriginalFileName?: string
  } | null
}

export type SubmittedCrimeConsentFile = {
  fileObjectId?: number
  url?: string
  fileName: string
}

/** 제출 문서에서 본인 업로드 파일만 고른다. 빈 양식 PDF는 대상이 아니다. */
export function resolveSubmittedCrimeConsentFile(
  detail: SubmittedCrimeConsentFileSource,
): SubmittedCrimeConsentFile {
  const fileName =
    detail.evidenceOriginalFileName?.trim() ||
    detail.filledDocument?.evidenceOriginalFileName?.trim() ||
    FALLBACK_FILE_NAME
  // signedFileObjectId는 시스템 보관 파일이라 회원 파일 다운로드가 403이다.
  const fileObjectId =
    detail.evidenceFileObjectId ?? detail.filledDocument?.evidenceFileObjectId
  if (fileObjectId != null) return { fileObjectId, fileName }

  const content = detail.content?.trim()
  if (content && /^(https?:|data:|\/)/.test(content)) {
    return { url: content, fileName }
  }

  return { fileName }
}
