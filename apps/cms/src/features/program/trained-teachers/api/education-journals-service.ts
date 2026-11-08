import JSZip from 'jszip'
import type { TrainedTeachersEducationJournalEntry } from '@/features/program/trained-teachers/model/institution-detail'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import { downloadAdminFile, loadAdminFileBlob } from '@/shared/lib/admin-file-upload'
import { downloadFile } from '@/shared/lib/file-download'
import { downloadBlob } from '@/shared/utils/file-download'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { mapEducationJournalResponseToEntry } from './education-journals-adapters'
import {
  bulkDownloadTrainedTeacherEducationJournalsRemote,
  createTrainedTeacherEducationJournalBulkDownloadJobRemote,
  createTrainedTeacherEducationJournalRemote,
  fetchAdminGeneratedFileJobRemote,
  fetchTrainedTeacherEducationJournalDownloadRemote,
  fetchTrainedTeacherEducationJournalFileBlob,
  fetchTrainedTeacherEducationJournalsRemote,
} from './education-journals-client'
import type { EducationJournalGeneratedFileJobResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalGeneratedFileJobResponse'
import { listTrainedTeacherOrganizationApplications } from './organization-applications-service'
import {
  mapPreferredScheduleBlocksToSessions,
  resolveTrainedTeacherTextbookDeliveryBadge,
} from './organization-applications-adapters'
import type { EducationJournalCreateRequest } from '@/shared/api/generated/dashboard/schemas/educationJournalCreateRequest'

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 교육일지 API가 활성화되지 않았습니다. VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED(또는 trainedTeacherPrograms)와 programs 모듈을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

async function removeZipManifest(blob: Blob): Promise<Blob> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  for (const path of Object.keys(zip.files)) {
    if (path.replace(/\\/g, '/') === 'manifest.json') {
      zip.remove(path)
    }
  }
  return zip.generateAsync({ type: 'blob' })
}

async function downloadEducationJournalZip(fileName: string, blob: Blob): Promise<void> {
  const sanitizedBlob = await removeZipManifest(blob)
  await downloadBlob(sanitizedBlob, fileName)
}

async function downloadFromEndpoint(fileName: string, endpoint?: string): Promise<void> {
  if (!endpoint?.trim()) {
    await downloadFile(fileName)
    return
  }
  let blob: Blob
  try {
    blob = await fetchTrainedTeacherEducationJournalFileBlob(endpoint)
  } catch {
    await downloadFile(fileName, endpoint)
    return
  }
  // 다운로드 이력 기록 실패도 호출부로 전달해 실패 안내를 띄운다.
  await downloadBlob(blob, fileName)
}

async function downloadZipFromEndpoint(fileName: string, endpoint: string): Promise<void> {
  const blob = await fetchTrainedTeacherEducationJournalFileBlob(endpoint)
  await downloadEducationJournalZip(fileName, blob)
}

export async function listTrainedTeacherEducationJournals(
  programId: string,
  organizationApplicationId: string
): Promise<TrainedTeachersEducationJournalEntry[]> {
  assertRemoteReady()
  const items = await fetchTrainedTeacherEducationJournalsRemote(
    programId,
    organizationApplicationId
  )
  return items.map((item, index) => mapEducationJournalResponseToEntry(item, index))
}

export async function createTrainedTeacherEducationJournal(
  programId: string,
  request: EducationJournalCreateRequest
): Promise<TrainedTeachersEducationJournalEntry> {
  assertRemoteReady()
  const dto = await createTrainedTeacherEducationJournalRemote(programId, request)
  return mapEducationJournalResponseToEntry(dto, 0)
}

export async function fetchTrainedTeacherEducationJournalBlob(
  programId: string,
  entry: TrainedTeachersEducationJournalEntry
): Promise<Blob> {
  assertRemoteReady()
  const meta = await fetchTrainedTeacherEducationJournalDownloadRemote(programId, entry.id)
  const endpoint = meta.downloadEndpoint?.trim()
  if (!endpoint) {
    throw new Error('교육일지 다운로드 경로가 없습니다.')
  }
  return fetchTrainedTeacherEducationJournalFileBlob(endpoint)
}

export async function downloadTrainedTeacherEducationJournal(
  programId: string,
  entry: TrainedTeachersEducationJournalEntry
): Promise<void> {
  assertRemoteReady()
  const meta = await fetchTrainedTeacherEducationJournalDownloadRemote(programId, entry.id)
  if (meta.fileObjectId != null && meta.fileObjectId > 0) {
    await downloadAdminFile({ fileObjectId: meta.fileObjectId, fileName: entry.fileName })
    return
  }
  await downloadFromEndpoint(entry.fileName, meta.downloadEndpoint)
}

export async function bulkDownloadTrainedTeacherEducationJournals(
  programId: string,
  organizationApplicationId: string,
  entries: TrainedTeachersEducationJournalEntry[]
): Promise<void> {
  assertRemoteReady()
  const journalIds = entries
    .map(entry => Number.parseInt(entry.id, 10))
    .filter(id => Number.isFinite(id))
  const response = await bulkDownloadTrainedTeacherEducationJournalsRemote(programId, {
    organizationApplicationId: Number.parseInt(organizationApplicationId, 10) || undefined,
    journalIds: journalIds.length > 0 ? journalIds : undefined,
  })
  if (response.downloadEndpoint) {
    await downloadZipFromEndpoint(
      `교육일지_일괄_${organizationApplicationId}.zip`,
      response.downloadEndpoint
    )
    return
  }
  for (const entry of entries) {
    await downloadTrainedTeacherEducationJournal(programId, entry)
  }
}

export async function createTrainedTeacherEducationJournalZipJob(
  programId: string,
  organizationApplicationId: string,
  entries: TrainedTeachersEducationJournalEntry[]
): Promise<EducationJournalGeneratedFileJobResponse> {
  assertRemoteReady()
  const journalIds = entries
    .map(entry => Number.parseInt(entry.id, 10))
    .filter(id => Number.isSafeInteger(id) && id > 0)
  if (journalIds.length === 0) {
    throw new Error('다운로드할 교육일지가 없습니다.')
  }
  return createTrainedTeacherEducationJournalBulkDownloadJobRemote(programId, {
    organizationApplicationId: Number.parseInt(organizationApplicationId, 10) || undefined,
    journalIds,
  })
}

export async function getTrainedTeacherEducationJournalZipJob(
  jobId: number
): Promise<EducationJournalGeneratedFileJobResponse> {
  assertRemoteReady()
  return fetchAdminGeneratedFileJobRemote(jobId)
}

export async function downloadTrainedTeacherEducationJournalZipJob(
  job: EducationJournalGeneratedFileJobResponse,
  organizationApplicationId: string
): Promise<void> {
  assertRemoteReady()
  const fileName = `교육일지_일괄_${organizationApplicationId}.zip`
  if (job.fileObjectId != null && job.fileObjectId > 0) {
    const blob = await loadAdminFileBlob(job.fileObjectId)
    await downloadEducationJournalZip(fileName, blob)
    return
  }
  if (!job.generatedFileEndpoint?.trim()) {
    throw new Error('교육일지 ZIP 다운로드 경로가 없습니다.')
  }
  await downloadZipFromEndpoint(fileName, job.generatedFileEndpoint)
}

function hasSelectedTrainedTeacherTextbook(row: ApplicantSchoolRow): boolean {
  const textbookId = row.detail?.textbookId?.trim() ?? ''
  const textbookName = row.textbookName?.trim() ?? ''
  const hasKits =
    (typeof row.textbookKits === 'number' && row.textbookKits > 0) ||
    (typeof row.textbookQuantity === 'number' && row.textbookQuantity > 0)
  return (
    (textbookId !== '' && textbookId !== TEXTBOOK_NOT_USED_OPTION_VALUE) ||
    (textbookName !== '' && textbookName !== '해당 없음' && textbookName !== '-') ||
    hasKits
  )
}

/**
 * 목록 교재 배송 현황. 저장 상태가 없고 교재가 지정돼 있으면 배송 전.
 * 교재가 없으면 해당 없음(-).
 */
export function resolveTrainedTeacherParticipatingTextbookStatus(
  row: ApplicantSchoolRow
): ParticipatingSchoolRow['textbookStatus'] {
  return resolveTrainedTeacherTextbookDeliveryBadge(
    row.textbookStatus,
    hasSelectedTrainedTeacherTextbook(row)
  )
}

/** 승인된 기관 신청 → 진행 현황 참여 기관 목록 */
export function mapApplicantSchoolToParticipatingSchool(
  row: ApplicantSchoolRow,
  index: number
): ParticipatingSchoolRow {
  const completed = row.completedEducationRoundCount
  const total = row.totalEducationRoundCount
  const lectureRoundFromCounts =
    completed != null && total != null ? `${completed}/${total}` : undefined
  return {
    id: row.id,
    organizationApplicationId: row.id,
    no: index + 1,
    schoolName: row.schoolName,
    region: row.region || '',
    educationGrade: row.educationGrade || '',
    classCount: row.classCount,
    studentCount: row.studentCount,
    lectureRound: row.lectureRound?.trim() || lectureRoundFromCounts || '',
    textbookStatus: resolveTrainedTeacherParticipatingTextbookStatus(row),
    approvalStatus: 'approved',
    teacherName: row.teacherName || '-',
    teacherMemberId: row.teacherMemberId,
    organizationId: row.organizationId,
    contact: row.contact,
    /** TT는 강사 Relation 없음 — 합성하지 않음 */
    instructors: '',
    programId: row.programId,
    /** 운영 일정 SSOT. 목록 GET에는 educationSchedules가 없으므로 []. 희망 지망으로 채우지 않는다. */
    sessions: row.educationScheduleSessions ?? [],
    hopeEducationSessions: mapPreferredScheduleBlocksToSessions(row.preferredScheduleBlocks),
    preferredScheduleBlocks: row.preferredScheduleBlocks,
    educationTarget: row.educationTarget,
    progressLabel: row.progressLabel,
    totalEducationRoundCount: row.totalEducationRoundCount,
    completedEducationRoundCount: row.completedEducationRoundCount,
    textbookName: row.textbookName,
    textbookId: row.detail?.textbookId,
    ...(row.textbookKits != null ? { textbookKits: row.textbookKits } : {}),
    ...(row.textbookQuantity != null ? { textbookQuantity: row.textbookQuantity } : {}),
    teacherPhone: row.contact,
    teacherMobile: row.contact,
    teacherEmail: row.detail?.teacherEmail,
    addressDetail: row.detail?.addressDetail,
    educationFormat: row.detail?.educationType,
    applicationReason: row.detail?.applicationReason,
    otherRequests: row.detail?.otherRequests,
    educationJournalCount: row.educationJournalCount,
    journalSubmitted: row.journalSubmitted,
    educationCompletionCount: row.educationCompletionCount,
    activityWithdrawn: row.activityWithdrawn === true,
    giveUpAt: row.giveUpAt,
    giveUpStopScheduleId: row.giveUpStopScheduleId,
  }
}

export async function listTrainedTeacherParticipatingInstitutions(
  programId: string,
  query: import('./organization-applications-list-query').TrainedTeacherOrganizationApplicationsListQuery = {}
): Promise<ParticipatingSchoolRow[]> {
  assertRemoteReady()
  const applications = await listTrainedTeacherOrganizationApplications(programId, {
    keyword: query.keyword,
    status: 'APPROVED',
  })
  return applications
    .filter(row => row.approvalStatus === 'approved')
    .map((row, index) => mapApplicantSchoolToParticipatingSchool(row, index))
}
