import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosClient, type RetryableRequest } from '@/shared/instance/axios-instance'
import { hydrateAxiosBlobError } from '@/shared/lib/admin-file-upload/attachments'
import { downloadBlob, fileNameFromContentDisposition } from '@/shared/utils/file-download'

/** axios 기본 Accept: application/json 만으로는 구 서버 PDF produce가 406이 날 수 있다. 406은 폴백 트리거가 아니다. */
export const ENCRYPTED_ADMIN_FILE_ACCEPT =
  'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/zip, application/octet-stream, application/json, */*'

function isMethodOrPathMissing(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status === 404 || status === 405
}

async function throwIfJsonErrorBlob(payload: Blob, status: number): Promise<void> {
  const type = payload.type.toLowerCase()
  if (type.includes('pdf') || type.includes('zip') || type.includes('spreadsheet') || type.includes('excel')) {
    return
  }
  const looksJson = type.includes('json')
  if (!looksJson) {
    const head = (await payload.slice(0, 1).text()).trim()
    if (head !== '{' && head !== '[') return
  }
  const error = new AxiosError('파일 다운로드에 실패했습니다.')
  error.response = {
    data: payload,
    status,
    statusText: 'Error',
    headers: {},
    config: error.config ?? ({ headers: {} } as InternalAxiosRequestConfig),
  }
  throw await hydrateAxiosBlobError(error)
}

/** POST { password } → 암호화된 blob 저장. GET 평문 fallback 없음. */
export async function postEncryptedAdminFile(input: {
  url: string
  password: string
  fallbackFileName: string
  extraBody?: Record<string, unknown>
  alternateUrls?: readonly string[]
}): Promise<void> {
  const urls = [input.url, ...(input.alternateUrls ?? [])]
  let lastError: unknown
  for (let i = 0; i < urls.length; i += 1) {
    try {
      const response = await axiosClient.request<Blob>({
        url: urls[i],
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: ENCRYPTED_ADMIN_FILE_ACCEPT,
        },
        data: { ...input.extraBody, password: input.password },
        responseType: 'blob',
        skipGlobalErrorAlert: true,
      } as RetryableRequest)
      const blob = response.data
      if (!(blob instanceof Blob) || blob.size < 1) {
        throw new Error('암호화된 파일을 받지 못했습니다.')
      }
      await throwIfJsonErrorBlob(blob, response.status)
      const header = response.headers['content-disposition']
      // 서버가 응답 전에 file-access 이력을 남긴다 — client 로그 중복 방지
      await downloadBlob(
        blob,
        fileNameFromContentDisposition(
          typeof header === 'string' ? header : undefined,
          input.fallbackFileName
        ),
        { skipAccessLog: true }
      )
      return
    } catch (error) {
      const hydrated = await hydrateAxiosBlobError(error)
      lastError = hydrated
      if (i < urls.length - 1 && isMethodOrPathMissing(hydrated)) {
        continue
      }
      throw hydrated
    }
  }
  throw lastError ?? new Error('파일 다운로드에 실패했습니다.')
}
