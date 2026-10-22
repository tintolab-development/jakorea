import { axiosClient } from '@/shared/api/axios-instance'
import { readDownloadUrlFromJsonBlob } from '@/shared/lib/download-attachment'
import type { ProgramApplicationType } from '../../applications/api/types'

const APPLICATIONS_PATH = '/api/portal/me/program-applications'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function applicationPath(applicationType: ProgramApplicationType, applicationId: string): string {
  return `${APPLICATIONS_PATH}/${applicationType}/${applicationId}`
}

export type PortalUjatClassAssignmentRow = {
  slotId?: number | null
  scheduleId?: number | null
  scheduleStartAt?: string | null
  date?: string | null
  grade?: string | null
  gradeLabel?: string | null
  className?: string | null
  classLabel?: string | null
  classNo?: number | null
  volunteerAName?: string | null
  volunteerBName?: string | null
  volunteerA?: string | null
  volunteerB?: string | null
  textbookName?: string | null
  textbookQuantity?: number | null
  textbookQuantityLabel?: string | null
  studentCount?: number | null
  attendanceManagerName?: string | null
  attendanceManager?: string | null
  consentDocumentsDownloadPath?: string | null
  downloadPath?: string | null
}

export type PortalUjatClassAssignmentSchedule = {
  scheduleId?: number | null
  scheduleStartAt?: string | null
  date?: string | null
  attendanceManagerName?: string | null
  attendanceManager?: string | null
  consentDocumentsDownloadPath?: string | null
  downloadPath?: string | null
  rows?: PortalUjatClassAssignmentRow[]
  slots?: PortalUjatClassAssignmentRow[]
  classes?: PortalUjatClassAssignmentRow[]
}

export type PortalUjatClassAssignmentsResponse = {
  schedules?: PortalUjatClassAssignmentSchedule[]
  items?: PortalUjatClassAssignmentSchedule[] | PortalUjatClassAssignmentRow[]
  content?: PortalUjatClassAssignmentSchedule[] | PortalUjatClassAssignmentRow[]
  slots?: PortalUjatClassAssignmentRow[]
}

/**
 * UJAT 기관 봉사자 배정 현황 — GET .../class-assignments
 * 학급·봉사자 A/B·교재는 이 응답만 SSOT. 신청 answers·프로그램 상세로 채우지 않는다.
 */
export async function fetchUjatClassAssignments(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalUjatClassAssignmentsResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/class-assignments`,
    { signal },
  )
  return unwrapEnvelope<PortalUjatClassAssignmentsResponse>(data) ?? {}
}

function saveBlob(fileName: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
}

/**
 * 성범죄경력 조회 동의서 일괄 다운로드 (행정정보 공동이용 동의서 포함).
 * `consentDocumentsDownloadPath` 가 있을 때만 호출한다.
 */
export async function downloadUjatClassAssignmentConsentDocuments(
  downloadPath: string,
  fallbackFileName = '성범죄경력_조회_동의서.zip',
): Promise<void> {
  const path = downloadPath.trim()
  if (!path) throw new Error('다운로드 경로가 없습니다.')

  const { data } = await axiosClient.get<unknown>(path, { responseType: 'blob' })
  if (!isBlob(data)) {
    throw new Error('동의서 파일을 받지 못했습니다.')
  }

  const signedUrl = await readDownloadUrlFromJsonBlob(data)
  if (signedUrl) {
    const { data: file } = await axiosClient.get<Blob>(signedUrl, { responseType: 'blob' })
    saveBlob(fallbackFileName, file)
    return
  }

  if (/\bjson\b/i.test(data.type) || data.size === 0) {
    throw new Error('동의서 다운로드에 실패했습니다.')
  }
  saveBlob(fallbackFileName, data)
}
