const SPONSOR_LOGO_MAX_COUNT = 20
const SPONSOR_LOGO_MAX_BYTES_PER_FILE = 20 * 1024 * 1024

const SPONSOR_LOGO_ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'ai', 'eps', 'svg'])

export const SPONSOR_LOGO_ACCEPT = '.jpg,.jpeg,.png,.ai,.eps,.svg'

export const SPONSOR_LOGO_GUIDE_LINES = [
  '- 파일은 JPG, PNG, AI, EPS, SVG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

function fileExtension(fileName: string): string {
  const name = fileName.trim().toLowerCase()
  return name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
}

export function validateSponsorLogoTotalCount(
  retainedLogoCount: number,
  pendingFiles: ReadonlyArray<File>
): string | null {
  if (retainedLogoCount + pendingFiles.length > SPONSOR_LOGO_MAX_COUNT) {
    return `후원사 로고는 최대 ${SPONSOR_LOGO_MAX_COUNT}개까지 등록할 수 있습니다.`
  }
  return validateSponsorLogoSelection(pendingFiles)
}

export function validateSponsorLogoSelection(files: ReadonlyArray<File>): string | null {
  if (files.length > SPONSOR_LOGO_MAX_COUNT) {
    return `후원사 로고는 최대 ${SPONSOR_LOGO_MAX_COUNT}개까지 등록할 수 있습니다.`
  }
  for (const file of files) {
    const ext = fileExtension(file.name)
    if (!SPONSOR_LOGO_ALLOWED_EXTENSIONS.has(ext)) {
      return 'JPG, PNG, AI, EPS, SVG 형식만 등록할 수 있습니다.'
    }
    if (file.size > SPONSOR_LOGO_MAX_BYTES_PER_FILE) {
      return '파일당 최대 20MB까지 등록할 수 있습니다.'
    }
    if (file.size < 1) {
      return '업로드할 파일이 비어 있습니다.'
    }
  }
  return null
}

export function mergeSponsorLogoFiles(
  current: ReadonlyArray<File>,
  added: ReadonlyArray<File>
): File[] {
  const next = [...current, ...added]
  const validationError = validateSponsorLogoSelection(next)
  if (validationError) return [...current]
  const seen = new Set<string>()
  const deduped: File[] = []
  for (const file of next) {
    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(file)
  }
  return deduped
}
