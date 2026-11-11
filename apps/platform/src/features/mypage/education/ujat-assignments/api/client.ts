import { axiosClient } from '@/shared/api/axios-instance'
import type { ProgramApplicationType } from '../../applications/api/types'
import { toRuleDownloadFileName } from '@/shared/lib/download-file-name'

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

/** OpenAPI `MemberPortalUjatClassAssignmentRow` */
export type PortalUjatClassAssignmentRow = {
  slotId?: number | null
  grade?: string | null
  gradeLabel?: string | null
  className?: string | null
  classLabel?: string | null
  classNo?: string | number | null
  volunteerAName?: string | null
  volunteerBName?: string | null
  textbookName?: string | null
  /** 학급 학생 수. 교재 준비수량이 아님. 표 컬럼에 쓰지 않는다. */
  studentCount?: number | null
  textbookQuantity?: number | null
  textbookQuantityLabel?: string | null
}

/** OpenAPI `MemberPortalUjatClassAssignmentSchedule` */
export type PortalUjatClassAssignmentSchedule = {
  scheduleId?: number | null
  scheduleStartAt?: string | null
  date?: string | null
  attendanceManagerName?: string | null
  consentDocumentsDownloadPath?: string | null
  rows?: PortalUjatClassAssignmentRow[]
}

/** OpenAPI `MemberPortalUjatClassAssignmentsResponse` */
export type PortalUjatClassAssignmentsResponse = {
  schedules?: PortalUjatClassAssignmentSchedule[]
}

/**
 * UJAT 기관 봉사자 배정 현황 — GET .../class-assignments
 * 학급·봉사자 A/B·교재는 이 응답만 SSOT. 신청 answers·프로그램 상세로 채우지 않는다.
 * 200 `schedules`만 사용. 404는 신청 없음이며 빈 목록으로 바꾸지 않는다.
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
  const unwrapped = unwrapEnvelope<PortalUjatClassAssignmentsResponse>(data)
  if (!unwrapped || typeof unwrapped !== 'object') return { schedules: [] }
  return unwrapped
}

function saveBlob(fileName: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = toRuleDownloadFileName(fileName)
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
  // 저장 이름: [JA Korea] 성범죄경력 조회 동의서_YYMMDD.zip (학생 초상권 동의서 ZIP과 같은 형식)
  fallbackFileName = '성범죄경력 조회 동의서.zip',
): Promise<void> {
  const path = downloadPath.trim()
  if (!path) throw new Error('다운로드 경로가 없습니다.')

  const { data } = await axiosClient.get<unknown>(path, {
    responseType: 'blob',
    // 실패(409 등)는 JSON으로 온다. zip만 받으면 서버가 오류 본문을 쓰지 못해 500이 된다.
    headers: { Accept: 'application/zip, application/json' },
  })
  if (!isBlob(data)) {
    throw new Error('동의서 파일을 받지 못했습니다.')
  }
  if (/\bjson\b/i.test(data.type) || data.size === 0) {
    throw new Error('동의서 다운로드에 실패했습니다.')
  }
  saveBlob(fallbackFileName, data)
}
